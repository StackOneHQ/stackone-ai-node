# StackOne AI Node.js SDK

StackOne AI provides a unified interface for accessing various SaaS tools through AI-friendly APIs.

## Installation

```bash
# Using npm
npm install stackone-ai-node

# Using yarn
yarn add stackone-ai-node

# Using bun
bun add stackone-ai-node
```

## Authentication

Set the `STACKONE_API_KEY` environment variable:

```bash
export STACKONE_API_KEY=<your-api-key>
```

or load from a .env file using your preferred environment variable library.

## Account IDs

StackOne uses account IDs to identify different integrations. You can specify the account ID when initializing the SDK or when getting tools.

## Quickstart

```typescript
import { StackOneToolSet } from 'stackone-ai-node';

// Initialize with API key from environment variable
const toolset = new StackOneToolSet();

// Or initialize with explicit API key
// const toolset = new StackOneToolSet('your-api-key');

// Get all HRIS-related tools
const accountId = '45072196112816593343';
const tools = toolset.getTools('hris_*', accountId);

// Use a specific tool
const employeeTool = tools.getTool('hris_list_employees');
if (employeeTool) {
  const employees = await employeeTool.execute();
  console.log(employees);
}
```

## Custom Base URL

You can specify a custom base URL when initializing the SDK. This is useful for testing against development APIs or working with self-hosted StackOne instances.

```typescript
import { StackOneToolSet } from 'stackone-ai-node';

// Initialize with a custom base URL
const toolset = new StackOneToolSet(
  process.env.STACKONE_API_KEY,
  process.env.STACKONE_ACCOUNT_ID,
  'https://api.example-dev.com'
);

// Get tools with the custom base URL
const tools = toolset.getTools('hris_*');

// All API requests will use the custom base URL
const employeeTool = tools.getTool('hris_list_employees');
if (employeeTool) {
  const employees = await employeeTool.execute();
  console.log(employees);
}
```

## AI Framework Integrations

### OpenAI

```typescript
import { StackOneToolSet } from 'stackone-ai-node';
import OpenAI from 'openai';

const toolset = new StackOneToolSet();
const tools = toolset.getTools('hris_*', 'your-account-id');

// Convert to OpenAI functions
const openAITools = tools.toOpenAI();

// Use with OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const response = await openai.chat.completions.create({
  model: 'gpt-4-turbo',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'List all employees' },
  ],
  tools: openAITools,
});
```

## Error Handling

The SDK provides specific error classes for different types of errors:

- `StackOneError`: Base error class for all SDK errors
- `StackOneAPIError`: Raised when the StackOne API returns an error
- `ToolsetConfigError`: Raised when there is an error in the toolset configuration
- `ToolsetLoadError`: Raised when there is an error loading tools

```typescript
import { StackOneToolSet, StackOneAPIError } from 'stackone-ai-node';

const toolset = new StackOneToolSet();
const tools = toolset.getTools('hris_*', 'your-account-id');
const tool = tools.getTool('hris_get_employee');

try {
  const result = await tool.execute({ id: 'employee-id' });
  console.log(result);
} catch (error) {
  if (error instanceof StackOneAPIError) {
    console.error(`API Error (${error.statusCode}):`, error.responseBody);
  } else {
    console.error('Error:', error);
  }
}
```

## License

Apache 2.0
