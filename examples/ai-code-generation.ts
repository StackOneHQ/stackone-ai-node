#!/usr/bin/env bun
/**
 * Example: AI-powered code generation using StackOne typed SDK
 *
 * This example demonstrates how to:
 * 1. Generate typed client files from the StackOne tool catalog
 * 2. Use Claude (Haiku 4.5) to generate TypeScript code based on user queries
 * 3. Execute the generated code and display results
 * 4. Save run history with timestamps (prompt, code, output)
 *
 * Usage:
 *   STACKONE_API_KEY=xxx \
 *   STACKONE_ACCOUNT_IDS=accountId \
 *   ANTHROPIC_API_KEY=xxx \
 *   bun run ./examples/ai-code-generation.ts "List all employees"
 *
 * Environment variables:
 *   - STACKONE_API_KEY: Your StackOne API key (required)
 *   - STACKONE_ACCOUNT_IDS: Comma-separated list of account IDs (required)
 *   - STACKONE_BASE_URL: Base URL for StackOne API (optional, defaults to https://api.stackone.com)
 *   - ANTHROPIC_API_KEY: Your Anthropic API key (required)
 *
 * Output structure:
 *   examples/generated-dynamic-tools/{accountId}/
 *   ├── index.ts          # Typed wrapper functions
 *   ├── types.d.ts        # Type definitions
 *   └── runs/
 *       └── {timestamp}/
 *           ├── generated-code.ts # Generated code
 *           └── output.json       # Execution result (includes query)
 */

import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { anthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { $ } from 'bun';
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

// Parse command line arguments
function parseArgs(): { query: string; noCache: boolean } {
  const args = Bun.argv.slice(2);
  const noCache = args.includes('--no-cache');
  const queryArgs = args.filter((arg) => arg !== '--no-cache');
  const query = queryArgs.join(' ').trim();

  if (!query) {
    throw new Error(
      'Please provide a query as a command line argument.\n' +
        'Example: bun run ./examples/ai-code-generation.ts "List all employees"\n' +
        'Options:\n' +
        '  --no-cache  Force regeneration of typed client (skip cache)'
    );
  }
  return { query, noCache };
}

// Generate timestamp for run directory
function generateTimestamp(): string {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

// Generate typed client and return the types file content
// If cache exists and noCache is false, skip generation
async function generateTypedClient(
  accountId: string,
  noCache: boolean
): Promise<{ typesContent: string; outputDir: string }> {
  console.log('\n=== Step 1: Generating typed client ===');

  const outputDir = join(import.meta.dirname, 'generated-dynamic-tools');
  const dtsPath = join(outputDir, accountId, 'types.d.ts');
  const indexPath = join(outputDir, accountId, 'index.ts');

  // Check if cached files exist
  const dtsFile = Bun.file(dtsPath);
  const indexFile = Bun.file(indexPath);
  const cacheExists = (await dtsFile.exists()) && (await indexFile.exists());

  if (cacheExists && !noCache) {
    console.log(`Using cached typed client for account ${accountId}`);
    console.log(`Types file: ${dtsPath}`);
    const typesContent = await dtsFile.text();
    return { typesContent, outputDir };
  }

  const toolset = new StackOneToolSet({
    baseUrl: STACKONE_BASE_URL,
    apiKey: STACKONE_API_KEY,
  });

  const now = performance.now();
  await toolset.generateTypedClient({
    outputDir,
    name: accountId,
    accountIds: [accountId],
  });
  const duration = (performance.now() - now).toFixed(2);

  console.log(`Generated typed client for account ${accountId} in ${duration}ms`);
  console.log(`Types file: ${dtsPath}`);

  const typesContent = await Bun.file(dtsPath).text();
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
   - \`baseUrl\`: Use \`Bun.env.STACKONE_BASE_URL\`
4. Call the appropriate function(s) from the imported module \`F\` to fulfil the user's request
5. Print the result using \`console.log(JSON.stringify(result, null, 2))\`
6. Handle any required parameters appropriately - use sensible defaults or empty values where optional
7. For list operations, consider using pagination parameters if available

## Performance Best Practices (CRITICAL)

**IMPORTANT: Minimise API calls. Prefer fewer, well-configured calls over many small ones.**

1. **Use List endpoints with expand/include parameters**: When you need related data, use the \`expand\` or \`include\` query parameters on List endpoints to fetch related data in a SINGLE call
   - ❌ Bad: Calling List to get IDs, then calling Get for each ID to fetch details
   - ✅ Good: Calling List once with \`expand\` or \`include\` parameters to get all data

2. **NEVER loop over IDs to make individual Get calls**: This is an N+1 anti-pattern
   - ❌ Bad: \`items.map(item => F.getItem(client, { path: { id: item.id } }))\`
   - ✅ Good: Use the List endpoint with appropriate \`fields\`, \`expand\`, or \`include\` parameters

3. **Use fields parameter**: Request only the fields you need to reduce payload size

4. **Use filter parameters**: Filter data server-side rather than fetching everything and filtering client-side

5. **Only use Promise.all for truly independent operations**: e.g., fetching two different resource types simultaneously, NOT for fetching each item of the same type individually

## Output Format

Return ONLY the executable TypeScript code in the 'code' field.`;
}

// Schema for structured code generation output
const codeGenerationSchema = z.object({
  code: z.string().describe('The generated executable TypeScript code'),
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

  return object.code;
}

// Execute the generated code and return the output
async function executeCode(
  code: string,
  outputDir: string
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  // Write the generated code to a temp file
  const generatedFilePath = join(outputDir, '_generated-code.ts');
  await Bun.write(generatedFilePath, code);

  // Execute the generated code
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

  // Clean up temporary file
  await unlink(generatedFilePath);

  return { stdout, stderr, exitCode };
}

// Save run artifacts to timestamped directory
async function saveRunArtifacts(
  outputDir: string,
  accountId: string,
  timestamp: string,
  userQuery: string,
  code: string,
  stdout: string,
  stderr: string,
  exitCode: number
): Promise<string> {
  const runDir = join(outputDir, accountId, 'runs', timestamp);

  // Create run directory
  await $`mkdir -p ${runDir}`;

  // Save generated code
  await Bun.write(join(runDir, 'generated-code.ts'), code);

  // Save output as JSON (includes query)
  const output = {
    timestamp,
    query: userQuery,
    exitCode,
    stdout: tryParseJson(stdout),
    stderr: stderr || undefined,
  };
  await Bun.write(join(runDir, 'output.json'), JSON.stringify(output, null, 2));

  return runDir;
}

// Try to parse JSON, return original string if parsing fails
function tryParseJson(str: string): unknown {
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}

// Main function
async function main(): Promise<void> {
  validateEnvironment();

  const { query: userQuery, noCache } = parseArgs();
  const timestamp = generateTimestamp();

  console.log(`\nUser query: "${userQuery}"`);
  console.log(`Timestamp: ${timestamp}`);

  // Use the first account ID for this example
  const accountId = ACCOUNT_IDS[0];
  console.log(`Using account ID: ${accountId}`);

  // Step 1: Generate typed client (uses cache by default)
  const { typesContent, outputDir } = await generateTypedClient(accountId, noCache);

  // Step 2: Build prompt and generate code with Claude
  const prompt = buildPrompt(typesContent, userQuery, accountId);
  const code = await generateCodeWithClaude(prompt);

  // Step 3: Display generated code
  console.log('\n=== Step 3: Generated Code ===');
  console.log('─'.repeat(60));
  console.log(code);
  console.log('─'.repeat(60));

  // Step 4: Execute the generated code
  console.log('\n=== Step 4: Executing generated code ===');
  const { stdout, stderr, exitCode } = await executeCode(code, outputDir);

  if (stderr) {
    console.error('\n[stderr]');
    console.error(stderr);
  }

  // Step 5: Save run artifacts
  console.log('\n=== Step 5: Saving run artifacts ===');
  const runDir = await saveRunArtifacts(
    outputDir,
    accountId,
    timestamp,
    userQuery,
    code,
    stdout,
    stderr,
    exitCode
  );
  console.log(`Saved to: ${runDir}`);

  // Step 6: Display results
  console.log('\n=== Step 6: Execution Result ===');
  if (exitCode !== 0) {
    console.error(`Execution failed with exit code ${exitCode}`);
  }
  console.log(stdout);

  console.log('\n✓ Done!');
}

if (import.meta.main) {
  await main();
}
