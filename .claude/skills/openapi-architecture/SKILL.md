---
name: openapi-architecture
description: OpenAPI specification processing and StackOne SDK architecture
---

# OpenAPI Architecture & StackOne SDK

This skill explains the core architecture and design patterns used in the StackOne AI Node SDK for transforming OpenAPI specifications into AI-friendly tools.

## Project Overview

The **StackOne AI Node SDK** is a TypeScript library that transforms OpenAPI specifications into AI-friendly tools for use with LLM frameworks like OpenAI and Vercel AI SDK.

## Core Components

### 1. Tool Class (`src/tool.ts`)
The fundamental building block that wraps API operations into AI agent-consumable format. Each tool represents a single API endpoint with:
- Schema validation
- Execution logic
- Input/output handling

### 2. ToolSets (`src/toolsets/`)
Collections of tools working together:
- **OpenAPIToolSet**: Generic toolset for any OpenAPI spec
- **StackOneToolSet**: Pre-configured for StackOne unified APIs (ATS, CRM, HRIS, etc.)

### 3. OpenAPI Processing (`src/openapi/`)
- **loader.ts**: Fetches and loads OpenAPI specifications
- **parser.ts**: Transforms OpenAPI operations into Tool instances
- **generated/**: Auto-generated TypeScript definitions from specs

### 4. Request Builder (`src/modules/requestBuilder.ts`)
Transforms tool inputs into properly formatted HTTP requests:
- Handles file uploads
- Manages authentication
- Supports multiple body types (JSON, form, multipart-form)

## Key Design Patterns

### Schema-First
Everything is driven by JSON Schema definitions from OpenAPI specs. This ensures consistency and type safety.

### Type Safety
Comprehensive TypeScript types are generated from OpenAPI specs, providing compile-time safety.

### Framework Agnostic
Core logic is independent of AI frameworks. Use adapters for OpenAI and Vercel AI.

### Lazy Loading
Tools are created on-demand to minimize memory usage.

### Extensibility
Hooks for parameter transformation and pre-execution logic allow customization.

## TypeScript Exhaustiveness Checks

Use the `satisfies never` pattern for compile-time exhaustiveness checking:

```typescript
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
    bodyType satisfies never; // Error if new variant added
    throw new Error(`Unsupported HTTP body type: ${String(bodyType)}`);
  }
}
```

This keeps union definitions and switch statements in sync. Adding a new union member will trigger a compile-time error.

## HTTP Body Types

The request builder supports three body types via `HttpBodyType`:
- **json**: Serialized JSON body with appropriate headers
- **form**: URL-encoded form data
- **multipart-form**: Multipart form data (for file uploads)

Each type is handled with proper header configuration and serialization.

## Development Workflow

1. OpenAPI specs are fetched from remote sources and stored in `specs/`
2. TypeScript types are auto-generated from specs into `src/openapi/generated/`
3. The parser transforms OpenAPI operations into Tool instances at runtime
4. Tools are used directly or via framework-specific adapters

## Important Notes

- All generated files should be committed (not gitignored)
- Follow existing patterns for error handling and logging
- Run `bun run rebuild` after updating OpenAPI specs
- The parser handles complex OpenAPI features like authentication, parameters, and responses

## Guidelines

- Maintain backward compatibility when updating OpenAPI specs
- Document any custom parameter transformations
- Use generated types throughout the codebase
- Test all changes thoroughly with MSW mocks
