---
description: Use when writing or running tests. Covers Vitest commands, MSW HTTP mocking, fs-fixture for file system tests. (project)
alwaysApply: false
paths: "**/*.test.ts"
globs: "*.test.ts"
---

# TypeScript Testing with Vitest and MSW

This rule guides testing practices for the StackOne SDK using Vitest test runner and Mock Service Worker (MSW) for HTTP mocking.

## Testing Framework

The project uses **Vitest** as the test runner. Run tests with:

- `pnpm test` - Run all tests (unit, examples, scripts)
- `pnpm vitest src/path/to/file.test.ts` - Run a specific test file
- `pnpm vitest -t "test name"` - Run tests matching a pattern

### Vitest Globals

**Vitest globals are enabled** (`globals: true` in `vitest.config.ts`). Do NOT import test utilities from `'vitest'` - they are available globally:

```typescript
// ❌ WRONG - Do NOT import from vitest
import { describe, it, expect, vi } from 'vitest';

// ✅ CORRECT - Use globals directly (no import needed)
describe('MyTest', () => {
  it('should work', () => {
    expect(true).toBe(true);
  });
});
```

Available globals: `describe`, `it`, `test`, `expect`, `vi`, `beforeAll`, `afterAll`, `beforeEach`, `afterEach`, `assert`, etc.

## MSW (Mock Service Worker)

**MSW is the preferred HTTP mocking solution.** MSW is configured globally in `vitest.setup.ts`, so no per-file setup is required.

### Adding Mock Handlers

Add endpoints to `mocks/handlers.ts`:

```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('https://api.example.com/endpoint', () => {
    return HttpResponse.json({ data: 'mock response' });
  }),
];
```

### Overriding Handlers in Tests

Use `server.use()` for test-specific overrides:

```typescript
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/node';

it('handles error responses', async () => {
  server.use(
    http.get('https://api.example.com/endpoint', () => {
      return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    })
  );
  // Test implementation
});
```

The global `afterEach` hook automatically calls `server.resetHandlers()` to reset overrides.

### Verifying Requests

Use MSW event listeners to verify requests were made:

```typescript
it('makes the expected request', async () => {
  const recordedRequests: Request[] = [];
  const listener = ({ request }: { request: Request }) => {
    recordedRequests.push(request);
  };
  server.events.on('request:start', listener);

  await someFunction();

  expect(recordedRequests).toHaveLength(1);
  expect(recordedRequests[0]?.url).toBe('https://api.example.com/endpoint');

  server.events.removeListener('request:start', listener);
});
```

## Important Rules

- **DO NOT** use `spyOn(globalThis, 'fetch')` - use MSW instead
- **DO NOT** add `beforeAll`/`afterAll`/`afterEach` for MSW setup in test files
- MSW handlers are automatically reset after each test

## Testing File System Operations

For file system tests, use `fs-fixture` with `await using` for automatic cleanup:

```typescript
import { createFixture } from 'fs-fixture';

it('should save file to disk', async () => {
  await using fixture = await createFixture();
  await fixture.writeFile('data.json', JSON.stringify({ test: 'data' }));
  expect(await fixture.exists('data.json')).toBe(true);
});
```

**Reference:** See `node_modules/fs-fixture/README.md` for full API and advanced usage

## Test Organisation

- Use snapshot testing for generated outputs
- Comprehensive unit tests for parsing logic
- Integration tests with example usage
- Group related tests with `describe()` blocks

## Guidelines

- Run tests frequently during development
- Maintain >90% code coverage for core modules
- Use descriptive test names that explain the behaviour being tested
- Keep tests isolated and independent
- Clean up MSW overrides automatically via global hooks
