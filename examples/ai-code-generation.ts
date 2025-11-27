#!/usr/bin/env bun
/**
 * Example: AI-powered code generation using StackOne typed SDK
 *
 * This example demonstrates how to:
 * 1. Generate typed client files from the StackOne tool catalog
 * 2. Use Claude (Sonnet 4.5) to generate TypeScript code based on user queries
 * 3. Execute the generated code and display results
 *
 * Usage:
 *   STACKONE_API_KEY=xxx \
 *   STACKONE_ACCOUNT_IDS=accountId \
 *   ANTHROPIC_API_KEY=xxx \
 *   bun run ./examples/ai-code-generation.ts "List all LMS users"
 *
 * Environment variables:
 *   - STACKONE_API_KEY: Your StackOne API key (required)
 *   - STACKONE_ACCOUNT_IDS: Comma-separated list of account IDs (required)
 *   - STACKONE_BASE_URL: Base URL for StackOne API (optional, defaults to https://api.stackone.com)
 *   - ANTHROPIC_API_KEY: Your Anthropic API key (required)
 */

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { anthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { z } from 'zod';
import { StackOneToolSet } from '../src';

// Type-safe environment variables
declare module 'bun' {
  interface Env {
    STACKONE_API_KEY: string;
    STACKONE_ACCOUNT_IDS: string;
    STACKONE_BASE_URL: string;
    ANTHROPIC_API_KEY: string;
    SKIP_AI_CODE_GENERATION_EXAMPLE: string;
  }
}

// Configuration
const STACKONE_API_KEY = Bun.env.STACKONE_API_KEY;
const STACKONE_BASE_URL = Bun.env.STACKONE_BASE_URL ?? 'https://api.stackone.com';
const ANTHROPIC_API_KEY = Bun.env.ANTHROPIC_API_KEY;
const ACCOUNT_IDS = (Bun.env.STACKONE_ACCOUNT_IDS ?? '')
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean);

// Validate environment
function validateEnvironment(): void {
  const isPlaceholderKey = !STACKONE_API_KEY || STACKONE_API_KEY === 'test-stackone-key';
  const shouldSkip = Bun.env.SKIP_AI_CODE_GENERATION_EXAMPLE !== '0' && isPlaceholderKey;

  if (shouldSkip) {
    console.log(
      'Skipping ai-code-generation example. Provide STACKONE_API_KEY and set SKIP_AI_CODE_GENERATION_EXAMPLE=0 to run.'
    );
    process.exit(0);
  }

  if (!STACKONE_API_KEY) {
    throw new Error('STACKONE_API_KEY is required');
  }

  if (ACCOUNT_IDS.length === 0) {
    throw new Error('STACKONE_ACCOUNT_IDS is required (comma-separated list of account IDs)');
  }

  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is required');
  }
}

// Get user query from command line arguments
function getUserQuery(): string {
  const query = Bun.argv.slice(2).join(' ').trim();
  if (!query) {
    throw new Error(
      'Please provide a query as a command line argument.\n' +
        'Example: bun run ./examples/ai-code-generation.ts "List all LMS users"'
    );
  }
  return query;
}

// Generate typed client and return the types file content
async function generateTypedClient(
  accountId: string
): Promise<{ typesContent: string; outputDir: string }> {
  console.log('\n=== Step 1: Generating typed client ===');

  const toolset = new StackOneToolSet({
    baseUrl: STACKONE_BASE_URL,
    apiKey: STACKONE_API_KEY,
  });

  const outputDir = join(import.meta.dirname, 'generated-dynamic-tools');

  const now = performance.now();
  const { dtsPath } = await toolset.generateTypedClient({
    outputDir,
    name: accountId,
    accountIds: [accountId],
  });
  const duration = (performance.now() - now).toFixed(2);

  console.log(`Generated typed client for account ${accountId} in ${duration}ms`);
  console.log(`Types file: ${dtsPath}`);

  const typesContent = await readFile(dtsPath, 'utf-8');
  return { typesContent, outputDir };
}

// Build the prompt for Claude
function buildPrompt(typesContent: string, userQuery: string, accountId: string): string {
  return `You are a TypeScript code generator. Generate executable TypeScript code that uses the StackOne API to fulfil the user's request.

## Available Type Definitions

The following type definitions are available from the generated typed client:

\`\`\`typescript
${typesContent}
\`\`\`

## User Query

${userQuery}

## Requirements

1. Import the wrapper functions using: \`import * as F from './${accountId}/index.ts'\`
2. Import \`DynamicToolClient\` from \`@stackone/ai\`
3. Create a \`DynamicToolClient\` instance with the following configuration:
   - \`apiKey\`: Use \`Bun.env.STACKONE_API_KEY\`
   - \`accountId\`: Use \`'${accountId}'\`
   - \`baseUrl\`: Use \`Bun.env.STACKONE_BASE_URL ?? 'https://api.stackone.com'\`
4. Call the appropriate function(s) from the imported module \`F\` to fulfil the user's request
5. Print the result using \`console.log(JSON.stringify(result, null, 2))\`
6. Handle any required parameters appropriately - use sensible defaults or empty values where optional
7. For list operations, consider using pagination parameters if available

## Output Format

Return the executable TypeScript code in the 'code' field. You may optionally provide an explanation in the 'explanation' field.`;
}

// Schema for structured code generation output
const codeGenerationSchema = z.object({
  code: z.string().describe('The generated executable TypeScript code'),
  explanation: z.string().optional().describe('Optional explanation of the generated code'),
});

// Generate code using Claude with structured output
async function generateCodeWithClaude(prompt: string): Promise<string> {
  console.log('\n=== Step 2: Generating code with Claude (Haiku 4.5) ===');

  const now = performance.now();
  const { object } = await generateObject({
    model: anthropic('claude-haiku-4-5-20251001'),
    schema: codeGenerationSchema,
    prompt,
  });
  const duration = (performance.now() - now).toFixed(2);

  console.log(`Code generated in ${duration}ms`);

  if (object.explanation) {
    console.log(`\nExplanation: ${object.explanation}`);
  }

  return object.code;
}

// Save and execute the generated code
async function executeGeneratedCode(code: string, outputDir: string): Promise<void> {
  console.log('\n=== Step 3: Generated Code ===');
  console.log('─'.repeat(60));
  console.log(code);
  console.log('─'.repeat(60));

  // Write the generated code to a file
  const generatedFilePath = join(outputDir, '_generated-code.ts');
  await writeFile(generatedFilePath, code, 'utf-8');
  console.log(`\nSaved generated code to: ${generatedFilePath}`);

  // Execute the generated code
  console.log('\n=== Step 4: Executing generated code ===');

  const proc = Bun.spawn(['bun', 'run', generatedFilePath], {
    cwd: outputDir,
    env: {
      ...Bun.env,
      STACKONE_API_KEY,
      STACKONE_BASE_URL,
    },
    stdout: 'pipe',
    stderr: 'pipe',
  });

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  if (stderr) {
    console.error('\n[stderr]');
    console.error(stderr);
  }

  if (exitCode !== 0) {
    throw new Error(`Generated code execution failed with exit code ${exitCode}`);
  }

  console.log('\n=== Step 5: Execution Result ===');
  console.log(stdout);
}

// Main function
async function main(): Promise<void> {
  validateEnvironment();

  const userQuery = getUserQuery();
  console.log(`\nUser query: "${userQuery}"`);

  // Use the first account ID for this example
  const accountId = ACCOUNT_IDS[0];
  console.log(`Using account ID: ${accountId}`);

  // Step 1: Generate typed client
  const { typesContent, outputDir } = await generateTypedClient(accountId);

  // Step 2: Build prompt and generate code with Claude
  const prompt = buildPrompt(typesContent, userQuery, accountId);
  const generatedCode = await generateCodeWithClaude(prompt);

  // Step 3 & 4: Save and execute the generated code
  await executeGeneratedCode(generatedCode, outputDir);

  console.log('\n✓ Done!');
}

if (import.meta.main) {
  await main();
}
