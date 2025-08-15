#!/usr/bin/env bun

/**
 * Example: Vector Search with Meta Tools
 *
 * This example demonstrates how to use the new vector embedding features
 * with meta tools for semantic search capabilities.
 */

import { openai } from '@ai-sdk/openai';
import { StackOneToolSet } from '../src';

async function main() {
  // Initialize toolset
  const toolSet = new StackOneToolSet({
    baseUrl: 'https://api.stackone.com',
    authentication: {
      type: 'bearer',
      credentials: {
        token: process.env.STACKONE_API_TOKEN || 'demo-token',
      },
    },
  });

  // Get tools
  const tools = toolSet.getTools(['hris_*', 'ats_*']);
  console.log(`Loaded ${tools.length} tools`);

  // Example 1: Meta tools without embeddings (text-only search)
  console.log('\n=== Text-Only Search ===');
  const textMetaTools = await tools.metaTools();
  const textSearchTool = textMetaTools.getTool('meta_filter_relevant_tools');

  if (textSearchTool) {
    const textResults = await textSearchTool.execute({
      query: 'employee management create new hire',
      limit: 3,
    });

    console.log('Text search results:');
    console.log(JSON.stringify(textResults, null, 2));
  }

  // Example 2: Meta tools with OpenAI embeddings for semantic search
  console.log('\n=== Vector Search with OpenAI ===');
  try {
    const vectorMetaTools = await tools.metaTools({
      model: openai.textEmbeddingModel('text-embedding-3-small'), // 1536 dimensions
    });

    const vectorSearchTool = vectorMetaTools.getTool('meta_filter_relevant_tools');

    if (vectorSearchTool) {
      // Pure vector search - finds semantically similar tools
      const vectorResults = await vectorSearchTool.execute({
        query: 'onboarding new staff members', // Semantic query
        mode: 'vector',
        limit: 3,
        minScore: 0.7,
      });

      console.log('Vector search results:');
      console.log(JSON.stringify(vectorResults, null, 2));

      // Hybrid search - combines text and vector search
      const hybridResults = await vectorSearchTool.execute({
        query: 'time off vacation requests',
        mode: 'hybrid',
        hybridWeights: { text: 0.3, vector: 0.7 }, // Prefer semantic understanding
        limit: 5,
      });

      console.log('\nHybrid search results:');
      console.log(JSON.stringify(hybridResults, null, 2));
    }
  } catch (error) {
    console.error('Vector search example failed (likely missing OpenAI API key):', error);
    console.log('To run vector search examples, set OPENAI_API_KEY environment variable');
  }

  // Example 3: Using with different AI SDK providers
  console.log('\n=== Alternative Providers ===');
  try {
    // You can use other AI SDK providers like Cohere, Mistral, etc.
    // import { cohere } from '@ai-sdk/cohere';
    // const cohereMetaTools = await tools.metaTools({
    //   model: cohere.textEmbeddingModel('embed-english-v3.0'),
    // });

    console.log('Vector search supports any AI SDK embedding provider:');
    console.log('- OpenAI: openai.textEmbeddingModel("text-embedding-3-small")');
    console.log('- Cohere: cohere.textEmbeddingModel("embed-english-v3.0")');
    console.log('- Mistral: mistral.textEmbeddingModel("mistral-embed")');
    console.log('- And more...');
  } catch (_error) {
    console.log('See AI SDK documentation for available providers');
  }
}

main().catch(console.error);
