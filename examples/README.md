# StackOne AI SDK Examples

Practical examples showing how to use the StackOne AI SDK with popular LLM providers and patterns.

## Setup

Install dependencies:

```bash
pnpm install
```

Set your credentials using either approach:

**Option A: Environment variables (shell)**

```bash
export STACKONE_API_KEY=your-stackone-api-key
export STACKONE_ACCOUNT_ID=your-account-id
export OPENAI_API_KEY=your-openai-api-key       # for OpenAI/AI SDK examples
export ANTHROPIC_API_KEY=your-anthropic-api-key  # for Anthropic examples
```

**Option B: `.env` file**

```bash
cp .env.example .env
# Edit .env with your keys
```

## Running Examples

```bash
# Using .env file (loads automatically):
pnpm run:example examples/openai-integration.ts

# Using shell env vars (no .env needed):
npx tsx examples/openai-integration.ts
```

Run mocked E2E tests (no API keys needed):

```bash
pnpm test
```

## Examples Overview

### [`openai-integration.ts`](./openai-integration.ts) -- OpenAI Chat Completions API

Fetches StackOne tools, converts them with `tools.toOpenAI()`, and sends them to the OpenAI Chat Completions API. Demonstrates the basic tool-call flow: create a completion, inspect the returned tool calls, and log arguments.

### [`openai-responses-integration.ts`](./openai-responses-integration.ts) -- OpenAI Responses API

Same idea as the Chat Completions example but targets the newer OpenAI Responses API (`openai.responses.create`). Uses `tools.toOpenAIResponses()` for the correct tool format and shows how to filter the response output for function calls.

### [`anthropic-integration.ts`](./anthropic-integration.ts) -- Anthropic Claude

Converts StackOne tools to Anthropic format with `tools.toAnthropic()` and sends a message to Claude. Shows action-pattern filtering (`*_list_*`, `*_search_*`) to load only relevant tools and iterates over response content blocks to extract tool-use results.

### [`ai-sdk-integration.ts`](./ai-sdk-integration.ts) -- Vercel AI SDK

Integrates with the Vercel AI SDK via `tools.toAISDK()`. Runs a multi-step agent loop using `generateText` with `stopWhen: stepCountIs(3)`, letting the model autonomously call tools and reason over results.

### [`claude-agent-sdk-integration.ts`](./claude-agent-sdk-integration.ts) -- Claude Agent SDK

Converts StackOne tools into an MCP server with `tools.toClaudeAgentSdk()` and passes it to the Claude Agent SDK `query()` function. Streams agent messages and logs tool-use blocks as they arrive.

### [`search-tools.ts`](./search-tools.ts) -- Tool Discovery

Covers five approaches to finding the right tools at runtime: direct fetch with action-pattern filters, semantic (embedding-based) search, local BM25/TF-IDF search, auto search that falls back gracefully, and a search-and-execute mode that hands `tool_search` + `tool_execute` to an LLM agent via the Vercel AI SDK.

### [`auth-management.ts`](./auth-management.ts) -- Authentication Patterns

Walks through every way to configure API keys and account IDs: reading from environment variables, passing them explicitly to the constructor, setting multiple accounts with `setAccounts()`, overriding per-tool collection or per individual tool, and fetching tools for multiple accounts in one call.

## Environment Variables

| Variable | Required | Used By |
|---|---|---|
| `STACKONE_API_KEY` | Yes | All examples |
| `STACKONE_ACCOUNT_ID` | Recommended | All examples (read automatically by `new StackOneToolSet()`) |
| `OPENAI_API_KEY` | For OpenAI / AI SDK examples | `openai-integration.ts`, `openai-responses-integration.ts`, `ai-sdk-integration.ts`, `search-tools.ts` (section 5) |
| `ANTHROPIC_API_KEY` | For Anthropic examples | `anthropic-integration.ts`, `claude-agent-sdk-integration.ts` |
