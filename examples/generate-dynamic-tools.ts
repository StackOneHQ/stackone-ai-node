#!/usr/bin/env bun
/**
 * Example: Generate typed wrappers from the live StackOne tool catalog.
 *
 * This example demonstrates how to use StackOneToolSet.generateTypedClient()
 * to create a typed TypeScript SDK from tools fetched via MCP.
 *
 * The generated files contain:
 * - types.d.ts: Type definitions (interfaces, type aliases, function declarations)
 * - index.ts: Implementation (wrapper functions)
 *
 * Usage:
 *   STACKONE_API_KEY=xxx STACKONE_ACCOUNT_IDS=acc1 bun run ./examples/generate-dynamic-tools.ts
 *
 * Output:
 *   examples/generated-dynamic-tools/{accountId}/types.d.ts
 *   examples/generated-dynamic-tools/{accountId}/index.ts
 */
import { join } from 'node:path';
import { StackOneToolSet } from '../src/toolsets';

async function main(): Promise<void> {
  const apiKey = process.env.STACKONE_API_KEY;
  if (!apiKey) {
    throw new Error('STACKONE_API_KEY is required to fetch tools');
  }

  const baseUrl = process.env.STACKONE_BASE_URL ?? 'https://api.stackone.com';
  const accountIds = (process.env.STACKONE_ACCOUNT_IDS ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

  if (accountIds.length === 0) {
    throw new Error('STACKONE_ACCOUNT_IDS is required (comma-separated list of account IDs)');
  }

  const toolset = new StackOneToolSet({ baseUrl, apiKey });
  const outputDir = join(import.meta.dirname, 'generated-dynamic-tools');

  // Generate typed client for each account
  for (const accountId of accountIds) {
    await toolset.generateTypedClient({
      outputDir,
      name: accountId,
      accountIds: [accountId],
    });
  }
}

if (import.meta.main) {
  await main();
}
