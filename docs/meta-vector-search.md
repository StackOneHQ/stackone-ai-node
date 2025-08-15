# Vector Search Documentation

This document explains the new vector embedding functionality for meta tools in StackOne AI Node SDK.

## Overview

The meta tools now support semantic search through vector embeddings, powered by the AI SDK. This enables finding tools based on semantic similarity rather than just keyword matching.

## Features

- **Hybrid Search**: Combines traditional BM25 text search with vector similarity
- **Multiple AI Providers**: Supports any AI SDK embedding provider (OpenAI, Cohere, Mistral, etc.)
- **Flexible Search Modes**: Text-only, vector-only, or hybrid search
- **Backward Compatible**: Existing code continues to work without changes
- **Type Safe**: Full TypeScript support with AI SDK native types

## Usage

### Basic Usage (Text-Only Search)

```typescript
import { StackOneToolSet } from '@stackone/ai';

const toolSet = new StackOneToolSet({ /* config */ });
const tools = toolSet.getTools(['hris_*']);

// Text-only search (existing behavior)
const metaTools = await tools.metaTools();
const searchTool = metaTools.getTool('meta_filter_relevant_tools');

const results = await searchTool.execute({
  query: 'employee management',
  limit: 5
});
```

### Vector Search with OpenAI

```typescript
import { StackOneToolSet } from '@stackone/ai';
import { openai } from '@ai-sdk/openai';

const toolSet = new StackOneToolSet({ /* config */ });
const tools = toolSet.getTools(['hris_*', 'ats_*']);

// Enable vector search with OpenAI embeddings
const metaTools = await tools.metaTools({
  model: openai.textEmbeddingModel('text-embedding-3-small')
});

const searchTool = metaTools.getTool('meta_filter_relevant_tools');

// Semantic search - finds tools by meaning
const results = await searchTool.execute({
  query: 'onboarding new staff members', // Semantic query
  mode: 'vector',
  limit: 5,
  minScore: 0.7
});
```

### Hybrid Search

```typescript
// Combine text and vector search for best results
const results = await searchTool.execute({
  query: 'time off vacation requests',
  mode: 'hybrid',
  hybridWeights: { 
    text: 0.3,    // 30% text relevance
    vector: 0.7   // 70% semantic relevance
  },
  limit: 5
});
```

### Other AI SDK Providers

```typescript
import { cohere } from '@ai-sdk/cohere';
import { mistral } from '@ai-sdk/mistral';

// Cohere embeddings
const cohereMetaTools = await tools.metaTools({
  model: cohere.textEmbeddingModel('embed-english-v3.0')
});

// Mistral embeddings  
const mistralMetaTools = await tools.metaTools({
  model: mistral.textEmbeddingModel('mistral-embed')
});
```

## Search Modes

### `text` Mode
Uses traditional BM25 keyword search only. Same as the original behavior.

```typescript
const results = await searchTool.execute({
  query: 'create employee',
  mode: 'text'
});
```

### `vector` Mode
Uses only semantic vector search. Best for finding conceptually similar tools.

```typescript
const results = await searchTool.execute({
  query: 'staff onboarding process',
  mode: 'vector',
  minScore: 0.8 // Higher similarity threshold
});
```

### `hybrid` Mode (Default)
Combines both text and vector search with configurable weights.

```typescript
const results = await searchTool.execute({
  query: 'employee benefits management',
  mode: 'hybrid',
  hybridWeights: { text: 0.4, vector: 0.6 }
});
```

## Configuration Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `query` | string | Search query (required) | - |
| `limit` | number | Max results to return | 5 |
| `minScore` | number | Minimum similarity score (0-1) | 0.3 |
| `mode` | string | Search mode: "text", "vector", "hybrid" | "hybrid" (if embeddings enabled) |
| `hybridWeights` | object | Weight distribution for hybrid search | `{ text: 0.5, vector: 0.5 }` |

## Performance Considerations

- **Embedding Generation**: Embeddings are generated once during initialization and cached
- **Batch Processing**: Multiple tool descriptions are embedded in parallel
- **Fallback Handling**: Automatically falls back to text search if embedding generation fails
- **Memory Usage**: Vector embeddings increase memory usage (1536 dimensions × number of tools)

## Error Handling

The implementation includes graceful error handling:

- **Embedding Failures**: Falls back to text-only search in hybrid mode
- **Vector Mode Errors**: Throws descriptive errors for vector-only search failures
- **Network Issues**: Retries and timeouts handled by AI SDK

## Migration Guide

### Existing Code
No changes needed! Existing code continues to work:

```typescript
// This still works exactly as before
const metaTools = await tools.metaTools();
```

### Adding Vector Search
Simply add the embedding model configuration:

```typescript
// Add vector search capability
const metaTools = await tools.metaTools({
  model: openai.textEmbeddingModel('text-embedding-3-small')
});
```

## Examples

See `examples/vector-search.ts` for complete working examples with:
- Text-only search (backward compatibility)
- Vector search with OpenAI
- Hybrid search with custom weights  
- Different AI SDK providers

## Dependencies

- Requires AI SDK (`ai` package) - already included as peer dependency
- Requires chosen embedding provider package (e.g., `@ai-sdk/openai`)
- Uses Orama's native vector search capabilities (no additional dependencies)

## Supported Embedding Providers

All AI SDK embedding providers are supported:
- **OpenAI**: `@ai-sdk/openai`
- **Cohere**: `@ai-sdk/cohere`  
- **Mistral**: `@ai-sdk/mistral`
- **Google**: `@ai-sdk/google`
- **Amazon Bedrock**: `@ai-sdk/amazon-bedrock`
- **Custom providers**: Any AI SDK compatible provider