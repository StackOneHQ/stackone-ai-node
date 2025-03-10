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

## Authentication

Set the `STACKONE_API_KEY` environment variable:

```bash
export STACKONE_API_KEY=<your-api-key>
```

or load from a .env file using your preferred environment variable library.

## Quickstart

```typescript
import { StackOneToolSet } from "@stackone/ai";

const toolset = new StackOneToolSet();
const tools = toolset.getTools("hris_*", "your-account-id");
const employeeTool = tools.getTool("hris_list_employees");
const employees = await employeeTool.execute();
```

[View full example](examples/index.ts)

## Account IDs

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

You can also apply custom headers when getting tools:

```typescript
// Apply custom headers including account ID
const tools = toolset.getTools("hris_*", {
  "x-account-id": "override-account-id",
  "x-custom-header": "custom-value",
});
```

[View full example](examples/account-id-usage.ts)

## Custom Base URL

```typescript
import { StackOneToolSet } from "@stackone/ai";

const toolset = new StackOneToolSet({ baseUrl: "https://api.example-dev.com" });
const tools = toolset.getTools("hris_*");
const employeeTool = tools.getTool("hris_list_employees");
```

[View full example](examples/custom-base-url.ts)

## File Uploads

```typescript
import { StackOneToolSet } from "@stackone/ai";

const toolset = new StackOneToolSet();
const uploadTool = toolset
  .getTools("hris_*")
  .getTool("hris_upload_employee_document");
await uploadTool.execute({
  file_path: "/path/to/document.pdf",
  id: "employee-id",
});
```

[View full example](examples/file-uploads.ts)

### Configurable Derivations for OpenAPIToolSet

When using the OpenAPIToolSet, you can configure custom derivation functions for file uploads:

```typescript
import { OpenAPIToolSet, DerivationConfig } from "@stackone/ai";
import {
  extractFileInfo,
  isValidFilePath,
  readFileAsBase64,
} from "@stackone/ai/utils/file";

// Define custom derivation functions
const derivationConfig: DerivationConfig = {
  // The source parameter from which other parameters will be derived
  sourceParameter: "file_path",

  // Define custom derivation functions
  derivationFunctions: {
    // Derive file content from file_path
    content: (filePath: unknown): string => {
      if (typeof filePath !== "string") {
        throw new Error("file_path must be a string");
      }

      if (!isValidFilePath(filePath)) {
        throw new Error(`Invalid file path or file not found: ${filePath}`);
      }

      return readFileAsBase64(filePath);
    },

    // Add more derivation functions as needed
    file_name: (filePath: unknown): string => {
      // Implementation...
    },
  },

  // List of parameters that should be derived from the source parameter
  derivedParameters: ["content", "file_name"],
};

// Create an OpenAPIToolSet with the custom derivation configuration
const toolset = new OpenAPIToolSet({
  filePath: "/path/to/openapi.json",
  derivationConfig,
});

// Now you can use the toolset with just the file_path parameter
const uploadTool = toolset.getTools("upload_*").getTool("upload_file");
await uploadTool.execute({
  file_path: "/path/to/file.pdf",
});
```

[View full example](examples/openapi-toolset-with-derivations.ts)

## Parameter Derivations

StackOne provides a powerful parameter derivation system that allows you to derive multiple parameters from a single source parameter. This is particularly useful for file uploads, where you can derive file content, name, and format from a file path, or for user data, where you can derive multiple user attributes from a user ID.

### File Upload Derivations

The `StackOneToolSet` comes with built-in derivations for file uploads:

```typescript
import { StackOneToolSet } from "stackone-ai-node";

// Initialize the toolset with built-in file upload derivations
const toolset = new StackOneToolSet();

// Get a file upload tool
const tools = toolset.getTools("*file_upload*");
const fileUploadTool = tools.getTool("storage_file_upload");

// Execute with just the file_path parameter
// The file_content, file_name, and file_format will be derived automatically
const result = await fileUploadTool.execute({ file_path: "/path/to/file.pdf" });
```

### Custom Derivations

You can also define your own derivation functions for any type of parameter:

```typescript
import { OpenAPIToolSet, DerivationConfig } from "stackone-ai-node";

// Define a custom derivation configuration for user data
const userDerivationConfig: DerivationConfig = {
  sourceParameter: "user_id",
  derivationFunctions: {
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

// Initialize the toolset with custom derivation config
const toolset = new OpenAPIToolSet({
  filePath: "/path/to/openapi.json",
  derivationConfig: userDerivationConfig,
});

// Execute with just the user_id parameter
// The first_name, last_name, and email will be derived automatically
const result = await tool.execute({ user_id: "user123" });
```

### Testing Derivations with dryRun

You can use the `dryRun` option to test parameter derivations without making actual API calls:

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

This is particularly useful for debugging and testing parameter derivations, as well as for creating examples that demonstrate how the derivation system works without making actual API calls.

## Error Handling

```typescript
import { StackOneAPIError, StackOneError } from "@stackone/ai";

try {
  await tool.execute();
} catch (error) {
  if (error instanceof StackOneAPIError) {
    // Handle API errors
  }
}
```

[View full example](examples/error-handling.ts)

## Integrations

### OpenAI

```typescript
import { OpenAI } from "openai";
import { StackOneToolSet } from "@stackone/ai";

const toolset = new StackOneToolSet();
const openAITools = toolset.getTools("hris_*").toOpenAI();
await openai.chat.completions.create({ tools: openAITools });
```

[View full example](examples/openai-integration.ts)

### AI SDK by Vercel

```typescript
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { StackOneToolSet } from "@stackone/ai";

const toolset = new StackOneToolSet();
const aiSdkTools = toolset.getTools("hris_*").toAISDK();
await generateText({ tools: aiSdkTools, maxSteps: 3 });
```

[View full example](examples/ai-sdk-integration.ts)

## OpenAPI ToolSet

The OpenAPIToolSet class allows you to parse OpenAPI specifications from either a local file or a remote URL.

### Loading from a File

```typescript
import { OpenAPIToolSet } from "@stackone/ai";
import path from "node:path";

// Path to your OpenAPI spec file
const filePath = path.join(__dirname, "path/to/openapi-spec.json");

// Create the toolset
const toolset = new OpenAPIToolSet({
  filePath,
  baseUrl: "https://api.example.com", // Optional base URL override
});

// Get all tools
const allTools = toolset.getTools();

// Get filtered tools
const filteredTools = toolset.getTools("user_*");
```

### Loading from a URL

```typescript
import { OpenAPIToolSet } from "@stackone/ai";

// URL to your OpenAPI spec
const url = "https://example.com/path/to/openapi-spec.json";

// Create the toolset using the factory method
const toolset = await OpenAPIToolSet.fromUrl({
  url,
  baseUrl: "https://api.example.com", // Optional base URL override
});

// Get all tools
const allTools = toolset.getTools();

// Get filtered tools
const filteredTools = toolset.getTools("crm_*");
```

### Authentication Options

The OpenAPIToolSet supports both Basic and Bearer authentication:

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

### Custom Headers

You can apply custom headers to tools when filtering:

```typescript
// Apply custom headers to tools
const toolsWithHeaders = toolset.getTools("user_*", {
  "x-custom-header": "custom-value",
  "x-api-version": "1.0.0",
});
```

### Key Differences from StackOneToolSet

The OpenAPIToolSet differs from StackOneToolSet in several important ways:

1. **Authentication**: OpenAPIToolSet supports Basic and Bearer authentication, while StackOneToolSet uses API key authentication.

2. **File Upload Handling**: StackOneToolSet automatically processes file upload operations to make them easier to use, while OpenAPIToolSet preserves the original OpenAPI spec without modifications.

3. **Source**: StackOneToolSet loads tools from the predefined StackOne API specs, while OpenAPIToolSet can load from any OpenAPI spec file or URL.

4. **Headers**: Both toolsets allow you to apply custom headers when filtering tools, but they handle them differently. StackOneToolSet accepts an account ID string that gets converted to a header, while OpenAPIToolSet accepts a headers object directly.

[View full example](examples/openapi-toolset.ts)

## Advanced Usage

### OpenAPI Loader

The OpenAPILoader class provides low-level access to loading OpenAPI specifications from various sources.

```typescript
import { OpenAPILoader } from "@stackone/ai/openapi/loader";
import path from "node:path";

// Load from a directory
const directorySpecs = OpenAPILoader.loadFromDirectory(
  path.join(__dirname, ".oas")
);

// Load from a file
const fileSpecs = OpenAPILoader.loadFromFile(
  path.join(__dirname, ".oas/hris.json")
);

// Load from a URL
const urlSpecs = await OpenAPILoader.loadFromUrl(
  "https://example.com/path/to/openapi-spec.json"
);
```

[View full example](examples/basic_usage/openapi_loader.ts)

### Base ToolSet Class

Both `StackOneToolSet` and `OpenAPIToolSet` extend the base `ToolSet` class, which provides common functionality for working with tools.

```typescript
import { ToolSet, StackOneToolSet, OpenAPIToolSet } from "@stackone/ai";

// Use the concrete implementations
const stackOneTools = new StackOneToolSet();
const openApiTools = new OpenAPIToolSet({
  apiKey: "your-api-key",
  filePath: "path/to/spec.json",
});

// Both share the same filtering capabilities
const hrisTools = stackOneTools.getTools("hris_*");
const userTools = openApiTools.getTools("user_*");
```

## Recent Changes

### Base Tool and ToolSet Classes

We've introduced a more flexible architecture with base classes:

1. **Base Tool Class**: A generic `Tool` class that supports different authentication methods (API key, Basic, Bearer) and custom headers.

2. **Base ToolSet Class**: A generic `ToolSet` class that provides common functionality for loading and filtering tools.

3. **Flexible Authentication**: Both `StackOneToolSet` and `OpenAPIToolSet` now support multiple authentication methods through a unified interface.

4. **Custom Headers**: The `getTools` method now accepts either an account ID string or a headers object, making it more flexible for different use cases.

5. **File Utilities**: All file-related operations have been consolidated into the `file.ts` utility module, providing consistent error handling and type safety.

These changes improve the maintainability and extensibility of the codebase while maintaining backward compatibility with existing code.
