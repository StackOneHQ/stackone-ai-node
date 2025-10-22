# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Building and Development
- `bun run build` - Build the project using tsdown
- `bun run rebuild` - Fetch latest OpenAPI specs and rebuild everything
- `bun run dev` - Watch mode for development (builds on file changes)
- `bun run fetch:specs` - Update OpenAPI specifications from remote

### Testing
- `bun run test` - Run all tests (unit, examples, scripts)
- `bun run test:unit` - Run only unit tests
- `bun test src/path/to/file.spec.ts` - Run a specific test file
- `bun test -t "test name"` - Run tests matching a pattern

### Code Quality
- `bun run lint` - Run Biome linter
- `bun run format` - Format code with Biome
- `bun run typecheck` - Type check with tsgo
- `bun run lint:fix` - Auto-fix linting issues

### Documentation
- `bun run docs:build` - Build MkDocs documentation
- `bun run docs:serve` - Serve docs locally
- `bun run docs:deploy` - Deploy docs to GitHub Pages

## Architecture Overview

This is the StackOne AI Node SDK - a TypeScript library that transforms OpenAPI specifications into AI-friendly tools for use with LLM frameworks like OpenAI and Vercel AI SDK.

### Core Components

1. **Tool Class** (`src/tool.ts`): The fundamental building block that wraps API operations into a format consumable by AI agents. Each tool represents a single API endpoint with schema validation and execution logic.

2. **ToolSets** (`src/toolsets/`): Collections of tools that work together
   - `OpenAPIToolSet`: Generic toolset that can parse any OpenAPI spec
   - `StackOneToolSet`: Pre-configured toolset for StackOne's unified APIs (ATS, CRM, HRIS, etc.)

3. **OpenAPI Processing** (`src/openapi/`):
   - `loader.ts`: Fetches and loads OpenAPI specifications
   - `parser.ts`: Transforms OpenAPI operations into Tool instances
   - `generated/`: Auto-generated TypeScript definitions from OpenAPI specs

4. **Request Building** (`src/modules/requestBuilder.ts`): Handles the complex logic of transforming tool inputs into properly formatted HTTP requests, including file uploads and authentication.

### Key Design Patterns

- **Schema-First**: Everything is driven by JSON Schema definitions from OpenAPI specs
- **Type Safety**: Comprehensive TypeScript types generated from OpenAPI ensure compile-time safety
- **Framework Agnostic**: Core logic is independent of AI frameworks, with adapters for OpenAI and Vercel AI
- **Lazy Loading**: Tools are created on-demand to minimize memory usage
- **Extensibility**: Hooks for parameter transformation and pre-execution logic

### TypeScript Exhaustiveness Checks

When branching on string unions, prefer the `satisfies never` pattern to guarantee compile-time exhaustiveness without introducing temporary variables. Example from `RequestBuilder.buildFetchOptions`:

```ts
switch (bodyType) {
  case 'json':
    // ...
    break;
  case 'form':
    // ...
    break;
  case 'multipart-form':
    // ...
    break;
  default: {
    bodyType satisfies never; // raises a type error if a new variant is added
    throw new Error(`Unsupported HTTP body type: ${String(bodyType)}`);
  }
}
```

Use this approach to keep the union definition (`type HttpBodyType = 'json' | 'multipart-form' | 'form'`) and the switch statement in sync. Adding a new union member will cause TypeScript to report the missing case at compile time.

### Testing Strategy

Tests use Bun's built-in test runner with a Jest-compatible API. Key patterns:
- **MSW (Mock Service Worker)** for HTTP request mocking - preferred over `spyOn(globalThis, 'fetch')`
- Snapshot testing for generated outputs
- Comprehensive unit tests for parsing logic
- Integration tests with example usage

#### Testing with MSW

The project uses [MSW](https://mswjs.io/) for mocking HTTP requests in tests. MSW is set up globally in `bun.test.setup.ts`, so you don't need to set up the server in individual test files.

**Adding Mock Handlers:**

Add your mock endpoints to `mocks/handlers.ts`:

```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('https://api.example.com/endpoint', () => {
    return HttpResponse.json({ data: 'mock response' });
  }),
  // ... other handlers
];
```

**Overriding Handlers in Tests:**

Use `server.use()` to override handlers for specific test cases:

```typescript
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/node';

it('handles error responses', async () => {
  server.use(
    http.get('https://api.example.com/endpoint', () => {
      return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    })
  );

  // Your test code here
});
```

The global `afterEach` hook in `bun.test.setup.ts` automatically calls `server.resetHandlers()` to reset overrides.

**Verifying Requests:**

Use MSW's event listeners to verify that requests were made:

```typescript
it('makes the expected request', async () => {
  const recordedRequests: Request[] = [];
  const listener = ({ request }: { request: Request }) => {
    recordedRequests.push(request);
  };
  server.events.on('request:start', listener);

  // Make your request
  await someFunction();

  expect(recordedRequests).toHaveLength(1);
  expect(recordedRequests[0]?.url).toBe('https://api.example.com/endpoint');

  server.events.removeListener('request:start', listener);
});
```

**Important Notes:**
- Do NOT use `spyOn(globalThis, 'fetch')` - use MSW instead for consistent mocking
- Do NOT add `beforeAll`/`afterAll`/`afterEach` for MSW setup in test files - it's already configured globally
- MSW handlers are reset after each test automatically
- For tests that need to run their own servers (e.g., MCP servers), you may need to temporarily close and restart MSW

#### Testing File System Operations

For tests that need to work with the file system, use [`fs-fixture`](https://github.com/privatenumber/fs-fixture) to create temporary test directories that are automatically cleaned up.

**IMPORTANT: Always use `await using` syntax with fs-fixture to ensure automatic cleanup. Do NOT manually manage fixture lifecycle with `.rm()`.**

**Basic Usage:**

```typescript
import { createFixture } from 'fs-fixture';

it('should save file to disk', async () => {
  // Using the 'await using' syntax ensures automatic cleanup
  await using fixture = await createFixture();

  // Write files using fixture methods
  await fixture.writeFile('data.json', JSON.stringify({ test: 'data' }));

  // Verify the file exists
  expect(await fixture.exists('data.json')).toBe(true);

  // Read the file back
  const content = await fixture.readFile('data.json', 'utf8');
  expect(JSON.parse(content)).toEqual({ test: 'data' });

  // fixture is automatically cleaned up when the test completes
});
```

**Creating Pre-populated Fixtures:**

```typescript
it('should read existing files', async () => {
  await using fixture = await createFixture({
    'config.json': JSON.stringify({ setting: 'value' }),
    'data/file.txt': 'content',
    'src/index.ts': 'export const test = "hello";',
  });

  // Files are already created at fixture.path
  const result = await processConfig(fixture.path);
  expect(result).toBeDefined();
});
```

**Type-Safe JSON Operations:**

```typescript
it('should handle JSON with type safety', async () => {
  await using fixture = await createFixture();

  interface Config {
    name: string;
    version: string;
  }

  // Write JSON with formatting
  await fixture.writeJson('config.json', { name: 'test', version: '1.0.0' }, 2);

  // Read JSON with type inference
  const config = await fixture.readJson<Config>('config.json');
  expect(config.name).toBe('test');
});
```

**Available Methods:**
- `fixture.path` - Absolute path to fixture directory
- `fixture.getPath(...paths)` - Build paths relative to fixture root
- `fixture.exists(path)` - Check if file/directory exists
- `fixture.readFile(path, encoding?)` - Read file as string or Buffer
- `fixture.writeFile(path, content)` - Write file content
- `fixture.readJson<T>(path)` - Parse JSON with type safety
- `fixture.writeJson(path, data, space?)` - Write formatted JSON
- `fixture.mkdir(path)` - Create nested directories
- `fixture.readdir(path, options?)` - List directory contents
- `fixture.cp(source, dest?)` - Copy files into fixture

**Benefits:**
- Automatic cleanup with TypeScript 5.2+ `await using` declarations - no manual cleanup needed
- Isolated test environment - each test gets its own temporary directory
- Zero dependencies, lightweight (1.1 kB gzipped)
- Type-safe JSON operations with generics
- Works seamlessly with Bun's test runner

**Learn More:**
- [fs-fixture Documentation](https://github.com/privatenumber/fs-fixture) - Official documentation with advanced usage patterns and API reference

### Development Workflow

1. OpenAPI specs are fetched from remote sources and stored in `specs/`
2. TypeScript types are generated from these specs into `src/openapi/generated/`
3. The parser transforms OpenAPI operations into Tool instances at runtime
4. Tools can be used directly or through framework-specific adapters

When modifying the codebase:
- Run tests frequently during development
- Use `bun run rebuild` after updating OpenAPI specs
- Ensure all generated files are committed (they're not gitignored)
- Follow the existing patterns for error handling and logging
