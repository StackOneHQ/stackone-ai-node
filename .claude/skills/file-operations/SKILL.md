---
name: file-operations
description: Use when making HTTP requests. Covers native fetch API patterns and error handling. (project)
globs: "*.ts"
alwaysApply: false
---

# HTTP Request Standards

This skill provides guidance on HTTP request patterns in the StackOne SDK.

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

## When to Use Direct HTTP Clients

Only use specialised HTTP clients when:
- You need advanced features not covered by fetch (e.g., interceptors, retries)
- You're integrating with a framework that requires it
- Document why you're not using native fetch
