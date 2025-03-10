# StackOne AI Node.js SDK

StackOne AI provides a unified interface for accessing various SaaS tools through AI-friendly APIs.

## Installation

```bash
# Using npm
npm install @stackone/ai

# Using yarn
yarn add @stackone/ai

# Using bun
bun add @stackone/ai
```

## Toolsets

StackOne provides two toolsets:

- `OpenAPIToolSet`: A toolset generated from OpenAPI specifications
- `StackOneToolSet`: A toolset for StackOne APIs

Under the hood the StackOneToolSet uses the same OpenAPIParser as the OpenAPIToolSet, but provides some convenience methods for using StackOne API keys and account IDs.

## Integrations

These integrations work with both the OpenAPIToolSet and StackOneToolSet. They make it super easy to use these APIs in your AI applications.

### OpenAI

```typescript
import { OpenAI } from "openai";
import { StackOneToolSet } from "@stackone/ai";
// or
import { OpenAPIToolSet } from "@stackone/ai";

const toolset = new StackOneToolSet();
// or
const toolset = new OpenAPIToolSet({ filePath: "path/to/openapi.json" });

const openAITools = toolset.getTools("hris_*").toOpenAI();
await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    {
      role: "system",
      content: "You are a helpful assistant.",
    },
    {
      role: "user",
      content: "What is the name of the employee with id 123?",
    },
  ],
  tools: openAITools,
});
```

[View full example](examples/openai-integration.ts)

### AI SDK by Vercel

```typescript
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { StackOneToolSet } from "@stackone/ai";

const toolset = new StackOneToolSet();

const aiSdkTools = toolset.getTools("hris_*").toAISDK();
await generateText({
  model: openai("gpt-4o"),
  tools: aiSdkTools,
  maxSteps: 3,
});
```

[View full example](examples/ai-sdk-integration.ts)

## OpenAPIToolSet

The OpenAPIToolSet class allows you to parse OpenAPI specifications as tools from either a local file or a remote URL.

### Loading from a File

```typescript
import { OpenAPIToolSet } from "@stackone/ai";
import path from "node:path";

// Create the toolset
const toolset = new OpenAPIToolSet({
  filePath: path.join(__dirname, "path/to/openapi-spec.json");
});

// Get all tools
const allTools = toolset.getTools();

// Get filtered tools
const filteredTools = toolset.getTools("user_*");
```

### Loading from a URL

```typescript
import { OpenAPIToolSet } from "@stackone/ai";

// Create the toolset using the factory method
const toolset = await OpenAPIToolSet.fromUrl({
  url: "https://example.com/path/to/openapi-spec.json",
});
```

### Authentication Options

The OpenAPIToolSet supports easy usage of bot Basic and Bearer authentication:

```typescript
// Basic Authentication
const toolsetWithBasicAuth = new OpenAPIToolSet({
  filePath: "path/to/spec.json",
  authentication: {
    type: "basic",
    credentials: {
      username: "user",
      password: "pass",
    },
  },
});

// Bearer Authentication
const toolsetWithBearerAuth = await OpenAPIToolSet.fromUrl({
  url: "https://example.com/spec.json",
  authentication: {
    type: "bearer",
    credentials: {
      token: "your-bearer-token",
    },
  },
});
```

You can also directly write to the toolset headers:

```typescript
const toolsetWithHeaders = new OpenAPIToolSet({
  filePath: "path/to/spec.json",
  headers: {
    Authorization: "Bearer your-bearer-token",
  },
});
```

## StackOneToolSet

The StackOneToolSet is an extension of the OpenAPIToolSet that adds some convenience methods for using StackOne API keys and account IDs and some other features.

```typescript
import { StackOneToolSet } from "@stackone/ai";

const toolset = new StackOneToolSet();
const tools = toolset.getTools("hris_*", "your-account-id");
const employeeTool = tools.getTool("hris_list_employees");
const employees = await employeeTool.execute();
```

[View full example](examples/index.ts)

### Authentication

Set the `STACKONE_API_KEY` environment variable:

```bash
export STACKONE_API_KEY=<your-api-key>
```

or load from a .env file using your preferred environment variable library.

### Account IDs

StackOne uses account IDs to identify different integrations. You can specify the account ID at different levels:

```typescript
import { StackOneToolSet } from "@stackone/ai";

// Method 1: Set at toolset initialization
const toolset = new StackOneToolSet({ accountId: "your-account-id" });

// Method 2: Set when getting tools (overrides toolset account ID)
const tools = toolset.getTools("hris_*", "override-account-id");

// Method 3: Set directly on a tool instance
tool.setAccountId("direct-account-id");
const currentAccountId = tool.getAccountId(); // Get the current account ID
```

[View full example](examples/account-id-usage.ts)

### File Upload

The `StackOneToolSet` comes with built-in transformations for file uploads:

```typescript
import { StackOneToolSet } from "@stackone/ai";

const toolset = new StackOneToolSet();
const tools = toolset.getTools("*file_upload*");
const fileUploadTool = tools.getTool("storage_file_upload");

// Execute with just the file_path parameter
// The file_content, file_name, and file_format will be derived automatically
const result = await fileUploadTool.execute({ file_path: "/path/to/file.pdf" });
```

[View full example](examples/file-uploads.ts)

> Note: you can build your own custom transformations using both toolset classes. See the [Parameter Transformations](#parameter-transformations) section for more information.

## Unified Features

These are some of the features which you can use with the OpenAPIToolSet and StackOneToolSet.

### Custom Base URL

```typescript
import { StackOneToolSet } from "@stackone/ai";

const toolset = new StackOneToolSet({ baseUrl: "https://api.example-dev.com" });
```

[View full example](examples/custom-base-url.ts)

### Parameter Transformations

You can derive multiple parameters from a single source parameter.

This is particularly useful for features like file uploads, where you can derive file content, name, and format from a file path, or for user data, where you can derive multiple user attributes from a user ID by doing a database lookup.

You can also define your own transformations for any type of parameter:

```typescript
import { OpenAPIToolSet } from "@stackone/ai";

// Define a custom transformation configuration for user data
const userTransforms = {
  transforms: {
    first_name: (userId) => {
      // Fetch user data and return first name
      return getUserFirstName(userId);
    },
    last_name: (userId) => {
      // Fetch user data and return last name
      return getUserLastName(userId);
    },
    email: (userId) => {
      // Fetch user data and return email
      return getUserEmail(userId);
    },
  },
  derivedParameters: ["first_name", "last_name", "email"],
};

// Initialize the toolset with custom transformation config
const toolset = new OpenAPIToolSet({
  filePath: "/path/to/openapi.json",
  transformers: {
    user_id: userTransforms,
  },
});

// Execute with just the user_id parameter
// The first_name, last_name, and email will be derived automatically
const result = await tool.execute({ user_id: "user123" });
```

### Testing with dryRun

You can use the `dryRun` option to return the api arguments from a tool call without making the actual api call:

```typescript
import { StackOneToolSet } from "stackone-ai-node";
import assert from "node:assert";

// Initialize the toolset
const toolset = new StackOneToolSet();
const fileUploadTool = toolset
  .getTools("*file_upload*")
  .getTool("storage_file_upload");

// Use dryRun to see how the file path is derived into other parameters
const dryRunResult = await fileUploadTool.execute(
  { file_path: "/path/to/file.pdf" },
  { dryRun: true }
);

// Verify the derived parameters
assert("file_content" in dryRunResult.mappedParams);
assert("file_name" in dryRunResult.mappedParams);
assert("file_format" in dryRunResult.mappedParams);
```

The `dryRun` option returns an object containing:

- `url`: The full URL with query parameters
- `method`: The HTTP method
- `headers`: The request headers
- `body`: The request body (or '[FormData]' for multipart form data)
- `mappedParams`: The parameters after mapping and derivation
- `originalParams`: The original parameters provided to the execute method
