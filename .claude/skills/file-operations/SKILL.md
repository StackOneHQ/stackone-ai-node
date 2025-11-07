---
name: file-operations
description: File operations and HTTP request standards for StackOne SDK
---

# File Operations and HTTP Standards

This skill provides guidance on file operations and HTTP request patterns in the StackOne SDK.

## Using File Utilities

When working with files and directories, use the utilities from `src/utils/file.ts` instead of direct `fs`/`path` operations.

### Available Utilities

Import the required utilities:
```typescript
import {
  isBase64,
  isValidFilePath,
  readFileAsBase64,
  extractFileInfo,
  directoryExists,
  listFilesInDirectory,
  readJsonFile,
  getFileNameWithoutExtension,
  joinPaths,
} from '../utils/file';
```

### Utility Functions

- **`isBase64(str: string): boolean`** - Check if a string is base64 encoded
- **`isValidFilePath(filePath: string): boolean`** - Check if a file path is valid and the file exists
- **`readFileAsBase64(filePath: string): string`** - Read a file and return its contents as base64
- **`extractFileInfo(filePath: string)`** - Extract file name and extension from a path
- **`directoryExists(dirPath: string): boolean`** - Check if a directory exists
- **`listFilesInDirectory(dirPath: string, filter?: (file: string) => boolean): string[]`** - List files in a directory with optional filtering
- **`readJsonFile<T>(filePath: string): T`** - Read and parse a JSON file with type safety
- **`getFileNameWithoutExtension(filePath: string): string`** - Get file name without extension
- **`joinPaths(...segments: string[]): string`** - Join path segments safely

### Benefits

- Consistent error handling across the codebase
- Type safety with generics
- Centralized file operations
- Easier to test and mock
- Prevents direct fs/path dependency scatter

### Examples

**Bad - Direct fs/path usage**:
```typescript
import fs from 'node:fs';
import path from 'node:path';

function processJsonFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    return data;
  }
  throw new Error(`File not found: ${filePath}`);
}
```

**Good - Using file utilities**:
```typescript
import { isValidFilePath, readJsonFile } from '../utils/file';

function processJsonFile<T>(filePath: string): T {
  if (isValidFilePath(filePath)) {
    return readJsonFile<T>(filePath);
  }
  throw new Error(`File not found: ${filePath}`);
}
```

**Bad - Direct directory operations**:
```typescript
import * as fs from 'node:fs';

function getJsonFiles(dirPath: string): string[] {
  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
    return fs.readdirSync(dirPath).filter(file => file.endsWith('.json'));
  }
  return [];
}
```

**Good - Using file utilities**:
```typescript
import { directoryExists, listFilesInDirectory } from '../utils/file';

function getJsonFiles(dirPath: string): string[] {
  if (directoryExists(dirPath)) {
    return listFilesInDirectory(dirPath, file => file.endsWith('.json'));
  }
  return [];
}
```

## Native Fetch API Standards

Use the native fetch API for HTTP requests. Node.js now includes built-in fetch, so external packages like `node-fetch` are not needed.

### Basic Pattern

```typescript
async function fetchData(url: string): Promise<unknown> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API error: ${response.status} for ${url}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Failed to fetch from ${url}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
```

### Key Guidelines

1. **No external imports needed**:
   - Do NOT import from `node-fetch` or similar packages
   - Simply use the globally available `fetch` function

2. **Always check response.ok**:
   ```typescript
   if (!response.ok) {
     throw new Error(`API error: ${response.status} for ${url}`);
   }
   ```

3. **Error handling**:
   - Use try/catch blocks for network errors
   - Include URL and status code in error messages

4. **Response processing**:
   - Use `response.json()` for JSON responses
   - Use `response.text()` for text responses
   - Use `response.arrayBuffer()` for binary data

5. **Request configuration**:
   - Set appropriate headers (Content-Type, Authorization, etc.)
   - Use correct HTTP method (GET, POST, PUT, DELETE, etc.)
   - For JSON requests, use `JSON.stringify()` and set Content-Type

### Examples

**GET with JSON response**:
```typescript
async function getUser(userId: string): Promise<User> {
  try {
    const response = await fetch(`https://api.example.com/users/${userId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.status}`);
    }

    return await response.json() as User;
  } catch (error) {
    throw new Error(`User fetch failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
```

**POST with JSON body**:
```typescript
async function createUser(data: CreateUserInput): Promise<User> {
  try {
    const response = await fetch('https://api.example.com/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create user: ${response.status}`);
    }

    return await response.json() as User;
  } catch (error) {
    throw new Error(`User creation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
```

**With Authorization**:
```typescript
async function getProtectedData(token: string): Promise<Data> {
  try {
    const response = await fetch('https://api.example.com/protected', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Auth failed: ${response.status}`);
    }

    return await response.json() as Data;
  } catch (error) {
    throw new Error(`Protected data fetch failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
```

## When to Use Direct fs/path

Only use direct `fs`/`path` operations when:
- The utility function doesn't exist for your use case
- You have a specific performance requirement
- Document why you're bypassing the utilities

## When to Use Direct HTTP Clients

Only use specialized HTTP clients when:
- You need advanced features not covered by fetch (e.g., interceptors, retries)
- You're integrating with a framework that requires it
- Document why you're not using native fetch
