/**
 * Code generation utilities for creating typed SDK files from fetched tools
 */
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import type { JSONSchema7Definition as JsonSchemaDefinition } from 'json-schema';
import type { BaseTool } from './tool';
import type { ToolParameters } from './types';

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

const isObjectSchema = (
  schema: JsonSchemaDefinition
): schema is JsonSchemaDefinition & { type?: string } =>
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

  if ('enum' in schema && schema.enum) {
    const values = schema.enum
      .filter((v) => v !== null)
      .map((v) => (typeof v === 'string' ? `'${v}'` : String(v)));
    if (schema.enum.includes(null)) {
      values.push('null');
    }
    return values.length > 0 ? values.join(' | ') : 'unknown';
  }

  if ('oneOf' in schema && schema.oneOf) {
    return schema.oneOf.map((s) => jsonSchemaToTs(s)).join(' | ');
  }

  if ('anyOf' in schema && schema.anyOf) {
    return schema.anyOf.map((s) => jsonSchemaToTs(s)).join(' | ');
  }

  if ('allOf' in schema && schema.allOf) {
    return schema.allOf.map((s) => jsonSchemaToTs(s)).join(' & ');
  }

  if ('type' in schema) {
    switch (schema.type) {
      case 'string':
        return 'string';
      case 'number':
      case 'integer':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'array': {
        const itemType = 'items' in schema ? jsonSchemaToTs(schema.items) : 'unknown';
        return `${itemType}[]`;
      }
      case 'object': {
        const props = ('properties' in schema && schema.properties) || {};
        const required = new Set(('required' in schema && schema.required) || []);
        const lines = Object.entries(props).map(([key, value]) => {
          const optional = required.has(key) ? '' : '?';
          const tsType = jsonSchemaToTs(value);
          return `${safeKey(key)}${optional}: ${tsType}`;
        });
        if ('additionalProperties' in schema && schema.additionalProperties) {
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

  return 'unknown';
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

function generateFunctionDeclaration(tool: ToolShape): string {
  const paramsName = `${toPascalCase(tool.name)}Params`;
  const fnName = toCamelCase(tool.name);
  const hasParams = Object.keys(tool.parameters.properties ?? {}).length > 0;
  const paramArg = hasParams ? `params: ${paramsName}` : `params?: ${paramsName}`;
  const description = tool.description ? `/** ${tool.description} */\n` : '';

  return `${description}export declare function ${fnName}(client: DynamicToolClient, ${paramArg}): Promise<JsonDict>;`;
}

function generateFunctionImplementation(tool: ToolShape): string {
  const paramsName = `${toPascalCase(tool.name)}Params`;
  const fnName = toCamelCase(tool.name);
  const hasParams = Object.keys(tool.parameters.properties ?? {}).length > 0;
  const paramArg = hasParams ? `params: ${paramsName}` : `params?: ${paramsName}`;

  return `export async function ${fnName}(client: DynamicToolClient, ${paramArg}): Promise<JsonDict> {
  return client.execute('${tool.name}', params);
}`;
}

/**
 * Generated typed client files content
 */
export interface GeneratedTypedClientFiles {
  /** Content of the .d.ts file (type definitions) */
  dts: string;
  /** Content of the .ts file (implementation) */
  ts: string;
}

/**
 * Generate the content of typed client files (both .d.ts and .ts)
 */
export function generateTypedClientContent(tools: BaseTool[]): GeneratedTypedClientFiles {
  const toolArray: ToolShape[] = tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  }));

  const interfaces = toolArray.map(generateParamsInterface).join('\n\n');
  const functionDeclarations = toolArray.map(generateFunctionDeclaration).join('\n\n');
  const functionImplementations = toolArray.map(generateFunctionImplementation).join('\n\n');
  const actionUnion = toolArray.map((t) => `'${t.name}'`).join(' | ');
  const paramTypes = toolArray.map((t) => `${toPascalCase(t.name)}Params`).join(',\n  ');

  // Generate .d.ts content (type definitions + function declarations)
  const dts = `// Auto-generated by StackOneToolSet.generateTypedClient()
// DO NOT EDIT THIS FILE DIRECTLY

import type { DynamicToolClient, JsonDict } from '@stackone/ai';

${interfaces}

export type DynamicToolName = ${actionUnion || "''"};

${functionDeclarations}
`;

  // Generate .ts content (implementation only, imports types from .d.ts)
  const ts = `// Auto-generated by StackOneToolSet.generateTypedClient()
// DO NOT EDIT THIS FILE DIRECTLY

import { DynamicToolClient, type JsonDict } from '@stackone/ai';
import type {
  ${paramTypes}
} from './types';

${functionImplementations}
`;

  return { dts, ts };
}

/**
 * Options for generating a typed client
 */
export interface GenerateTypedClientOptions {
  /**
   * Output directory for the generated files.
   * Files will be created as:
   * - {outputDir}/{name}/types.d.ts (type definitions)
   * - {outputDir}/{name}/index.ts (implementation)
   */
  outputDir: string;

  /**
   * Name for the generated module (e.g., account ID)
   */
  name: string;
}

/**
 * Write typed client files to disk
 * Creates both .d.ts (types) and .ts (implementation) files
 */
export async function writeTypedClientFiles(
  tools: BaseTool[],
  options: GenerateTypedClientOptions
): Promise<{ dtsPath: string; tsPath: string }> {
  const { dts, ts } = generateTypedClientContent(tools);

  const moduleDir = `${options.outputDir}/${options.name}`;
  const dtsPath = `${moduleDir}/types.d.ts`;
  const tsPath = `${moduleDir}/index.ts`;

  if (!existsSync(moduleDir)) {
    await mkdir(moduleDir, { recursive: true });
  }

  await Promise.all([writeFile(dtsPath, dts), writeFile(tsPath, ts)]);

  return { dtsPath, tsPath };
}

// Legacy single-file generation (deprecated)
/**
 * @deprecated Use generateTypedClientContent() which returns separate .d.ts and .ts content
 */
export function generateTypedClientContentLegacy(tools: BaseTool[]): string {
  const { dts, ts } = generateTypedClientContent(tools);
  // Combine for backwards compatibility
  return `${dts}\n${ts}`;
}
