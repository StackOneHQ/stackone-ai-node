# StackOne AI SDK Examples

This directory contains practical examples demonstrating how to use the StackOne AI SDK across different use cases and integrations.

## Quick Start

### Clone the repository

```bash
git clone https://github.com/StackOneHQ/stackone-ai-node.git
```

### 2. Authentication

Set your StackOne API key as an environment variable:

```bash
export STACKONE_API_KEY=your_api_key_here
```

Or create a `.env` file in the project root:

```env
STACKONE_API_KEY=your_api_key_here
```

Optional: Set an OpenAI API key as an environment variable:

```bash
export OPENAI_API_KEY=your_api_key_here
```

Or create a `.env` file in the project root:

```env
OPENAI_API_KEY=your_api_key_here
```

### 3. Configure Account IDs

Each example includes a placeholder account ID that you need to replace with your actual StackOne account ID:

```typescript
// Replace with your actual account ID from StackOne dashboard
const accountId = 'your-hris-account-id';
```

You can find your account IDs in the [StackOne dashboard](https://app.stackone.com).

## Running Examples

### Run Individual Examples

```bash
# Run a specific example
pnpm run examples/ai-sdk-integration.ts

# Or with Node.js
npx tsx examples/ai-sdk-integration.ts
```

### Run All Examples

```bash
# Test all examples (from examples directory)
cd examples && pnpm test
```

## Examples Overview

### Core Integration Examples

#### [`index.ts`](./index.ts) - Quickstart Guide

Basic example showing how to initialize the toolset and make your first API call.

- **Account ID**: HRIS
- **API Calls**: Yes
- **Key Features**: Basic tool usage, employee listing

#### [`interactive-cli.ts`](./interactive-cli.ts) - Interactive CLI Demo

Interactive command-line interface for dynamically discovering and executing StackOne tools using [@clack/prompts](https://github.com/bombshell-dev/clack).

- **Account ID**: User-provided or from environment
- **API Calls**: Yes (user selects which tool to execute)
- **Key Features**: Interactive prompts, environment variable fallback, spinner feedback, dynamic tool discovery

#### [`ai-sdk-integration.ts`](./ai-sdk-integration.ts) - AI SDK Integration

Demonstrates integration with Vercel's AI SDK for building AI agents.

- **Account ID**: HRIS
- **API Calls**: Via AI agent
- **Key Features**: AI SDK tools conversion, automated agent workflows

#### [`openai-integration.ts`](./openai-integration.ts) - OpenAI Integration

Shows how to use StackOne tools with OpenAI's function calling.

- **Account ID**: HRIS
- **API Calls**: Via OpenAI function calls
- **Key Features**: OpenAI tools format, function calling

### Configuration Examples

#### [`account-id-usage.ts`](./account-id-usage.ts) - Account ID Management

Demonstrates different ways to set and manage account IDs.

- **Account ID**: TEST (multiple)
- **API Calls**: No (dry run)
- **Key Features**: Account ID precedence, override patterns

#### [`custom-base-url.ts`](./custom-base-url.ts) - Custom Base URL

Shows how to use custom base URLs for development or self-hosted instances.

- **Account ID**: None
- **API Calls**: No (dry run)
- **Key Features**: Custom API endpoints, development setup

#### [`fetch-tools.ts`](./fetch-tools.ts) - Live Catalog Loading

Illustrates how to pull the latest tool catalog from StackOne and execute a tool with the fetched definitions.

- **Account ID**: HRIS
- **API Calls**: Yes (requires valid credentials)
- **Key Features**: Catalog refresh, zero local specs, production-style execution

### Advanced Features

#### [`experimental-document-handling.ts`](./experimental-document-handling.ts) - Document Processing

**⚠️ EXPERIMENTAL**: Advanced document handling with schema overrides.

- **Account ID**: HRIS
- **API Calls**: No (dry run)
- **Key Features**: Schema transformation, file processing, multi-source documents

#### [`filters.ts`](./filters.ts) - Advanced Filtering

Demonstrates complex filtering and query parameter serialization.

- **Account ID**: TEST
- **API Calls**: No (dry run)
- **Key Features**: Deep object serialization, complex filters, proxy parameters

#### [`human-in-the-loop.ts`](./human-in-the-loop.ts) - Human Validation

Shows how to implement human-in-the-loop workflows for validation.

- **Account ID**: HRIS
- **API Calls**: Conditional
- **Key Features**: Manual approval workflows, UI integration patterns

### OpenAPI Toolset Examples

#### [`openapi-toolset.ts`](./openapi-toolset.ts) - OpenAPI Integration

Demonstrates loading and using OpenAPI specifications directly.

- **Account ID**: None
- **API Calls**: No (dry run)
- **Key Features**: File loading, URL loading, OpenAPI parsing

### Planning Module (Beta)

#### [`planning.ts`](./planning.ts) - Workflow Planning

**🚧 CLOSED BETA**: Advanced workflow planning with StackOne's planning agent.

- **Account ID**: ATS, HRIS
- **API Calls**: Planning API
- **Key Features**: Multi-step workflows, caching, complex business processes

### Error Handling

#### [`error-handling.ts`](./error-handling.ts) - Error Management

Comprehensive error handling patterns and best practices.

- **Account ID**: TEST (invalid)
- **API Calls**: Intentionally failing calls
- **Key Features**: Error types, validation, graceful degradation

## Example Categories

### 🟢 Production Ready

Examples that are stable and recommended for production use:

- `index.ts`
- `interactive-cli.ts`
- `ai-sdk-integration.ts`
- `openai-integration.ts`
- `account-id-usage.ts`
- `custom-base-url.ts`
- `filters.ts`
- `error-handling.ts`
- `openapi-toolset.ts`

### 🟡 Advanced/Experimental

Examples showcasing advanced or experimental features:

- `experimental-document-handling.ts` (⚠️ API may change)
- `human-in-the-loop.ts`

### 🔵 Beta/Limited Access

Examples requiring special access:

- `planning.ts` (🚧 Closed beta only)

## Common Patterns

### Dry Run for Testing

Most examples support dry run mode to inspect requests without making API calls:

```typescript
const result = await tool.execute(params, { dryRun: true });
console.log(result.url); // The URL that would be called
console.log(result.method); // HTTP method
console.log(result.headers); // Request headers
console.log(result.body); // Request body
```

### Error Handling

All production examples include proper error handling:

```typescript
try {
  const result = await tool.execute(params);
  // Handle success
} catch (error) {
  if (error instanceof StackOneAPIError) {
    console.error("API Error:", error.statusCode, error.responseBody);
  } else {
    console.error("Unexpected error:", error.message);
  }
}
```

### Account ID Patterns

Examples demonstrate different ways to provide account IDs:

```typescript
// 1. At toolset initialization
const toolset = new StackOneToolSet({ accountId: "account_123" });

// 2. When getting tools
const tools = toolset.getStackOneTools("hris_*", "account_123");

// 3. Directly on individual tools
tool.setAccountId("account_123");
```

## Testing Examples

The examples include a comprehensive test suite:

```bash
# Run all example tests (from examples directory)
cd examples && pnpm test

# Run with verbose output
cd examples && pnpm test --verbose

# Run specific test
cd examples && pnpm test examples.spec.ts
```

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Ensure `STACKONE_API_KEY` is set correctly
2. **Account ID Errors**: Update account ID placeholders in the example files with your actual values
3. **Network Errors**: Check if you're behind a proxy or firewall
4. **TypeScript Errors**: Ensure you're using compatible Node.js and TypeScript versions

### Getting Help

- Check the [main README](../README.md) for general setup instructions
- Review the [StackOne documentation](https://docs.stackone.com)
- Open an issue on GitHub for bug reports or feature requests

## Contributing

When adding new examples:

1. Follow the existing naming convention
2. Add the example to this README
3. Include proper error handling
4. Add TypeScript types
5. Test with the examples test suite
6. Use inline placeholder account IDs with clear comments (e.g., `const accountId = 'your-hris-account-id';`)

## License

These examples are part of the StackOne AI SDK and are subject to the same license terms.
