#!/usr/bin/env bun
/**
 * Generate typed wrappers from the live StackOne tool catalog (fetchTools).
 *
 * - Fetches tools via MCP (StackOneToolSet.fetchTools) using your STACKONE_API_KEY.
 * - Emits a strongly typed params interface and a thin RPC-backed function for each tool.
 * - All functions call /actions/rpc with the right auth headers (Basic + optional x-account-id).
 *
 * Usage:
 *   STACKONE_API_KEY=xxx [STACKONE_ACCOUNT_IDS=acc1,acc2] [STACKONE_BASE_URL=...] bun run ./scripts/generate-dynamic-tools.ts
 *
 * Output:
 *   src/generated-dynamic-tools.ts
 */
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { JSONSchema7 as JsonSchema, JSONSchema7Definition as JsonSchemaDefinition } from 'json-schema';
import { StackOneToolSet } from '../src/toolsets';
import type { ToolParameters } from '../src/types';

const OUTPUT_PATH = join(process.cwd(), 'src', 'generated-dynamic-tools.ts');

type ToolShape = {
  name: string;
  description?: string;
  parameters: ToolParameters;
};

const safeKey = (key: string): string =>
  /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `'${key}'`;

const toPascalCase = (name: string): string =>
  name
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');

const toCamelCase = (name: string): string => {
  const pascal = toPascalCase(name);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
};

const isObjectSchema = (schema: JsonSchemaDefinition): schema is JsonSchema =>
  typeof schema === 'object' && schema !== null && !Array.isArray(schema);

function jsonSchemaToTs(schema: JsonSchemaDefinition | undefined): string {
  if (schema === undefined) {
    return 'unknown';
  }

  if (schema === true) {
    return 'unknown';
  }

  if (schema === false) {
    return 'never';
  }

  if (!isObjectSchema(schema)) {
    return 'unknown';
  }

  if (schema.enum) {
    const values = schema.enum
      .filter((v) => v !== null)
      .map((v) => (typeof v === 'string' ? `'${v}'` : String(v)));
    if (schema.enum.includes(null)) {
      values.push('null');
    }
    return values.length > 0 ? values.join(' | ') : 'unknown';
  }

  if (schema.oneOf) {
    return schema.oneOf.map((s) => jsonSchemaToTs(s)).join(' | ');
  }

  if (schema.anyOf) {
    return schema.anyOf.map((s) => jsonSchemaToTs(s)).join(' | ');
  }

  if (schema.allOf) {
    return schema.allOf.map((s) => jsonSchemaToTs(s)).join(' & ');
  }

  switch (schema.type) {
    case 'string':
      return 'string';
    case 'number':
    case 'integer':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'array': {
      const itemType = jsonSchemaToTs(schema.items);
      return `${itemType}[]`;
    }
    case 'object': {
      const props = schema.properties ?? {};
      const required = new Set(schema.required ?? []);
      const lines = Object.entries(props).map(([key, value]) => {
        const optional = required.has(key) ? '' : '?';
        const tsType = jsonSchemaToTs(value);
        return `${safeKey(key)}${optional}: ${tsType}`;
      });
      if (schema.additionalProperties) {
        const addlType =
          schema.additionalProperties === true
            ? 'unknown'
            : jsonSchemaToTs(schema.additionalProperties);
        lines.push(`[key: string]: ${addlType}`);
      }
      return `{ ${lines.join('; ')} }`;
    }
    default:
      return 'unknown';
  }
}

function generateParamsInterface(tool: ToolShape): string {
  const schema = tool.parameters;
  const props = schema.properties ?? {};
  const required = new Set(schema.required ?? []);
  const interfaceName = `${toPascalCase(tool.name)}Params`;
  const lines: string[] = [];
  lines.push(`export interface ${interfaceName} {`);

  if (Object.keys(props).length === 0) {
    lines.push('  // no parameters');
  }

  for (const [name, definition] of Object.entries(props)) {
    const tsType = jsonSchemaToTs(definition as JsonSchemaDefinition);
    const optional = required.has(name) ? '' : '?';
    lines.push(`  ${safeKey(name)}${optional}: ${tsType};`);
  }

  lines.push('}');
  return lines.join('\n');
}

function generateFunction(tool: ToolShape): string {
  const paramsName = `${toPascalCase(tool.name)}Params`;
  const fnName = toCamelCase(tool.name);
  const hasParams = Object.keys(tool.parameters.properties ?? {}).length > 0;
  const paramArg = hasParams ? `params: ${paramsName}` : `params?: ${paramsName}`;
  const description = tool.description ? `  /** ${tool.description} */\n` : '';

  return `${description}export async function ${fnName}(client: DynamicToolClient, ${paramArg}): Promise<JsonDict> {
  return client.execute('${tool.name}', params);
}`;
}

function emitFile(tools: ToolShape[], baseUrl: string): string {
  const interfaces = tools.map(generateParamsInterface).join('\n\n');
  const functions = tools.map(generateFunction).join('\n\n');
  const actionUnion = tools.map((t) => `'${t.name}'`).join(' | ');

  return `// Auto-generated by scripts/generate-dynamic-tools.ts
// DO NOT EDIT THIS FILE DIRECTLY

import type { JsonDict } from './types';

export interface DynamicToolClientConfig {
  apiKey: string;
  accountId?: string;
  baseUrl?: string;
  headers?: Record<string, string>;
}

export class DynamicToolClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(config: DynamicToolClientConfig) {
    this.baseUrl = config.baseUrl || '${baseUrl}';
    const authToken = Buffer.from(\`\${config.apiKey}:\`).toString('base64');
    this.headers = {
      Authorization: \`Basic \${authToken}\`,
      ...(config.accountId ? { 'x-account-id': config.accountId } : {}),
      ...(config.headers ?? {}),
    };
  }

  private extractRecord(source: Record<string, unknown>, key: string): Record<string, unknown> | undefined {
    const value = source[key];
    if (value === undefined || value === null) return undefined;
    return typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
  }

  async execute(action: DynamicToolName, params?: Record<string, unknown>): Promise<JsonDict> {
    const parsed = params ?? {};
    const path = this.extractRecord(parsed, 'path');
    const query = this.extractRecord(parsed, 'query');
    const paramHeaders = this.extractRecord(parsed, 'headers');
    const baseHeaders: Record<string, string> = { ...this.headers };

    if (paramHeaders) {
      for (const [key, value] of Object.entries(paramHeaders)) {
        if (value === undefined || value === null) continue;
        baseHeaders[key] = String(value);
      }
    }

    const bodyPayload = this.extractRecord(parsed, 'body') ?? {};
    const rpcBody: JsonDict = { ...bodyPayload };
    for (const [key, value] of Object.entries(parsed)) {
      if (key === 'body' || key === 'headers' || key === 'path' || key === 'query') continue;
      rpcBody[key] = value as unknown;
    }

    const response = await fetch(\`\${this.baseUrl}/actions/rpc\`, {
      method: 'POST',
      headers: {
        ...baseHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        body: rpcBody,
        headers: baseHeaders,
        path: path ?? undefined,
        query: query ?? undefined,
      }),
    });

    const text = await response.text();
    let parsedBody: unknown;
    try {
      parsedBody = text ? JSON.parse(text) : {};
    } catch (_error) {
      parsedBody = { raw: text };
    }

    if (!response.ok) {
      throw new Error(\`RPC error \${response.status}: \${typeof parsedBody === 'string' ? parsedBody : JSON.stringify(parsedBody)}\`);
    }

    return parsedBody as JsonDict;
  }
}

${interfaces}

export type DynamicToolName = ${actionUnion || "''"};

${functions}
`;
}

async function main(): Promise<void> {
  const apiKey = process.env.STACKONE_API_KEY;
  if (!apiKey) {
    throw new Error('STACKONE_API_KEY is required to fetch tools');
  }

  const baseUrl = process.env.STACKONE_BASE_URL || 'https://api.stackone.com';
  const accountIds = (process.env.STACKONE_ACCOUNT_IDS || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

  const toolset = new StackOneToolSet({ baseUrl, apiKey });
  if (accountIds.length > 0) {
    toolset.setAccounts(accountIds);
  }

  const tools = await toolset.fetchTools();
  const toolArray = tools.toArray().map(
    (tool) =>
      ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      }) satisfies ToolShape
  );

  const output = emitFile(toolArray, baseUrl);

  const dir = dirname(OUTPUT_PATH);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }

  await writeFile(OUTPUT_PATH, output);
  console.log(`✓ Generated dynamic tools SDK (${toolArray.length} tools) -> ${OUTPUT_PATH}`);
}

if (import.meta.main) {
  main().catch((error) => {
    console.error('Failed to generate dynamic tools SDK', error);
    process.exitCode = 1;
  });
}
