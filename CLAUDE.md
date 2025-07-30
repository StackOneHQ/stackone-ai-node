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

### Testing Strategy

Tests use Bun's built-in test runner with a Jest-compatible API. Key patterns:
- Mock HTTP requests using `bun:test` mock functions
- Snapshot testing for generated outputs
- Comprehensive unit tests for parsing logic
- Integration tests with example usage

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