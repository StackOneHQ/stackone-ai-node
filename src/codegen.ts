/**
 * Code generation utilities for creating typed SDK files from fetched tools
 *
 * Uses `untyped` for generating TypeScript type definitions with proper JSDoc comments.
 */
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import type { JSONSchema7Definition } from 'json-schema';
import type { InputObject, Schema } from 'untyped';
import { generateTypes, resolveSchema } from 'untyped';
import type { BaseTool } from './tool';
import type { ToolParameters } from './types';

type ToolShape = {
  name: string;
  description?: string;
  parameters: ToolParameters;
};

const toPascalCase = (name: string): string =>
  name
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');

const toCamelCase = (name: string): string => {
  const pascal = toPascalCase(name);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
};

/**
 * Maximum number of enum values before simplifying to base type
 */
const MAX_ENUM_VALUES = 20;

/**
 * Convert JSON Schema to untyped's input format
 * This transforms JSON Schema properties into untyped's $default/$schema format
 */
function jsonSchemaToUntypedInput(
  schema: JSONSchema7Definition | undefined
): Record<string, unknown> {
  if (schema === undefined || schema === true || schema === false) {
    return {};
  }

  if (typeof schema !== 'object' || schema === null) {
    return {};
  }

  // Handle enum with too many values - simplify to base type
  if ('enum' in schema && schema.enum && schema.enum.length > MAX_ENUM_VALUES) {
    const hasNull = schema.enum.includes(null);
    const hasString = schema.enum.some((v) => typeof v === 'string' && v !== null);
    const hasNumber = schema.enum.some((v) => typeof v === 'number');

    let tsType = 'unknown';
    if (hasString && hasNumber) {
      tsType = hasNull ? 'string | number | null' : 'string | number';
    } else if (hasString) {
      tsType = hasNull ? 'string | null' : 'string';
    } else if (hasNumber) {
      tsType = hasNull ? 'number | null' : 'number';
    }

    return {
      $schema: {
        tsType,
        description: schema.description,
        title: schema.title,
      },
    };
  }

  // Handle enum with reasonable number of values
  if ('enum' in schema && schema.enum) {
    const values = schema.enum
      .filter((v) => v !== null)
      .map((v) => (typeof v === 'string' ? `'${v}'` : String(v)));
    if (schema.enum.includes(null)) {
      values.push('null');
    }
    const tsType = values.length > 0 ? values.join(' | ') : 'unknown';

    return {
      $schema: {
        tsType,
        description: schema.description,
        title: schema.title,
      },
    };
  }

  // Handle oneOf/anyOf/allOf
  if ('oneOf' in schema && schema.oneOf) {
    const types = schema.oneOf.map((s) => schemaToTsType(s)).filter(Boolean);
    return {
      $schema: {
        tsType: types.join(' | ') || 'unknown',
        description: schema.description,
        title: schema.title,
      },
    };
  }

  if ('anyOf' in schema && schema.anyOf) {
    const types = schema.anyOf.map((s) => schemaToTsType(s)).filter(Boolean);
    return {
      $schema: {
        tsType: types.join(' | ') || 'unknown',
        description: schema.description,
        title: schema.title,
      },
    };
  }

  if ('allOf' in schema && schema.allOf) {
    const types = schema.allOf.map((s) => schemaToTsType(s)).filter(Boolean);
    return {
      $schema: {
        tsType: types.join(' & ') || 'unknown',
        description: schema.description,
        title: schema.title,
      },
    };
  }

  // Handle by type
  if ('type' in schema) {
    const schemaType = Array.isArray(schema.type) ? schema.type[0] : schema.type;

    switch (schemaType) {
      case 'string':
        return {
          $default: '',
          $schema: {
            description: schema.description,
            title: schema.title,
          },
        };

      case 'number':
      case 'integer':
        return {
          $default: 0,
          $schema: {
            description: schema.description,
            title: schema.title,
          },
        };

      case 'boolean':
        return {
          $default: false,
          $schema: {
            description: schema.description,
            title: schema.title,
          },
        };

      case 'array': {
        const itemType = schema.items
          ? schemaToTsType(schema.items as JSONSchema7Definition)
          : 'unknown';
        return {
          $default: [],
          $schema: {
            tsType: `Array<${itemType}>`,
            description: schema.description,
            title: schema.title,
          },
        };
      }

      case 'object': {
        const props = schema.properties ?? {};
        const requiredSet = new Set(schema.required ?? []);
        const result: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(props)) {
          result[key] = jsonSchemaToUntypedInput(value as JSONSchema7Definition);
        }

        // Handle additionalProperties
        if (schema.additionalProperties) {
          const addlType =
            schema.additionalProperties === true
              ? 'unknown'
              : schemaToTsType(schema.additionalProperties as JSONSchema7Definition);

          // If we have properties, add index signature info to schema
          if (Object.keys(props).length > 0) {
            return {
              ...result,
              $schema: {
                description: schema.description,
                title: schema.title,
                tsType: `{ ${Object.entries(props)
                  .map(([k, v]) => {
                    const optional = requiredSet.has(k) ? '' : '?';
                    return `${k}${optional}: ${schemaToTsType(v as JSONSchema7Definition)}`;
                  })
                  .join('; ')}; [key: string]: ${addlType} }`,
              },
            };
          }

          return {
            $schema: {
              tsType: `Record<string, ${addlType}>`,
              description: schema.description,
              title: schema.title,
            },
          };
        }

        if (Object.keys(result).length === 0) {
          return {
            $schema: {
              tsType: 'Record<string, unknown>',
              description: schema.description,
              title: schema.title,
            },
          };
        }

        return {
          ...result,
          $schema: {
            description: schema.description,
            title: schema.title,
          },
        };
      }

      default:
        return {
          $schema: {
            tsType: 'unknown',
            description: schema.description,
            title: schema.title,
          },
        };
    }
  }

  return {
    $schema: {
      tsType: 'unknown',
      description: schema.description,
      title: schema.title,
    },
  };
}

/**
 * Convert a JSON Schema definition to a TypeScript type string
 */
function schemaToTsType(schema: JSONSchema7Definition | undefined): string {
  if (schema === undefined || schema === true) return 'unknown';
  if (schema === false) return 'never';
  if (typeof schema !== 'object' || schema === null) return 'unknown';

  // Handle enum with too many values
  if ('enum' in schema && schema.enum && schema.enum.length > MAX_ENUM_VALUES) {
    const hasNull = schema.enum.includes(null);
    const hasString = schema.enum.some((v) => typeof v === 'string' && v !== null);
    const hasNumber = schema.enum.some((v) => typeof v === 'number');

    if (hasString && hasNumber) return hasNull ? 'string | number | null' : 'string | number';
    if (hasString) return hasNull ? 'string | null' : 'string';
    if (hasNumber) return hasNull ? 'number | null' : 'number';
    return 'unknown';
  }

  // Handle enum
  if ('enum' in schema && schema.enum) {
    const values = schema.enum
      .filter((v) => v !== null)
      .map((v) => (typeof v === 'string' ? `'${v}'` : String(v)));
    if (schema.enum.includes(null)) values.push('null');
    return values.length > 0 ? values.join(' | ') : 'unknown';
  }

  // Handle oneOf/anyOf/allOf
  if ('oneOf' in schema && schema.oneOf) {
    return schema.oneOf.map((s) => schemaToTsType(s)).join(' | ') || 'unknown';
  }
  if ('anyOf' in schema && schema.anyOf) {
    return schema.anyOf.map((s) => schemaToTsType(s)).join(' | ') || 'unknown';
  }
  if ('allOf' in schema && schema.allOf) {
    return schema.allOf.map((s) => schemaToTsType(s)).join(' & ') || 'unknown';
  }

  // Handle type
  if ('type' in schema) {
    const schemaType = Array.isArray(schema.type) ? schema.type[0] : schema.type;

    switch (schemaType) {
      case 'string':
        return 'string';
      case 'number':
      case 'integer':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'null':
        return 'null';
      case 'array': {
        const itemType = schema.items
          ? schemaToTsType(schema.items as JSONSchema7Definition)
          : 'unknown';
        return `Array<${itemType}>`;
      }
      case 'object': {
        const props = schema.properties ?? {};
        const requiredSet = new Set(schema.required ?? []);

        if (Object.keys(props).length === 0) {
          if (schema.additionalProperties) {
            const addlType =
              schema.additionalProperties === true
                ? 'unknown'
                : schemaToTsType(schema.additionalProperties as JSONSchema7Definition);
            return `Record<string, ${addlType}>`;
          }
          return 'Record<string, unknown>';
        }

        const propTypes = Object.entries(props).map(([key, value]) => {
          const optional = requiredSet.has(key) ? '' : '?';
          return `${key}${optional}: ${schemaToTsType(value as JSONSchema7Definition)}`;
        });

        if (schema.additionalProperties) {
          const addlType =
            schema.additionalProperties === true
              ? 'unknown'
              : schemaToTsType(schema.additionalProperties as JSONSchema7Definition);
          propTypes.push(`[key: string]: ${addlType}`);
        }

        return `{ ${propTypes.join('; ')} }`;
      }
      default:
        return 'unknown';
    }
  }

  return 'unknown';
}

/**
 * Generate untyped schema input for a tool's parameters
 */
function toolToUntypedInput(tool: ToolShape): Record<string, unknown> {
  const schema = tool.parameters;
  const props = schema.properties ?? {};
  const requiredSet = new Set(schema.required ?? []);

  const result: Record<string, unknown> = {};

  for (const [name, definition] of Object.entries(props)) {
    const converted = jsonSchemaToUntypedInput(definition as JSONSchema7Definition);

    // Mark as required using @required tag
    if (requiredSet.has(name) && typeof converted === 'object' && converted !== null) {
      const schemaObj = (converted as Record<string, unknown>).$schema as
        | Record<string, unknown>
        | undefined;
      if (schemaObj) {
        schemaObj.tags = ['@required'];
      } else {
        (converted as Record<string, unknown>).$schema = { tags: ['@required'] };
      }
    }

    result[name] = converted;
  }

  return result;
}

/**
 * Generate TypeScript interface for a tool's parameters using untyped
 */
async function generateParamsInterface(tool: ToolShape): Promise<string> {
  const interfaceName = `${toPascalCase(tool.name)}Params`;
  const untypedInput = toolToUntypedInput(tool);

  if (Object.keys(untypedInput).length === 0) {
    return `export interface ${interfaceName} {\n  // no parameters\n}`;
  }

  const resolved = await resolveSchema(untypedInput as InputObject);
  const types = generateTypes(resolved as Schema, {
    interfaceName,
    addExport: true,
    addDefaults: false,
  });

  return types.trim();
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
export async function generateTypedClientContent(
  tools: BaseTool[]
): Promise<GeneratedTypedClientFiles> {
  const toolArray: ToolShape[] = tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  }));

  // Generate interfaces using untyped (async)
  const interfaces = await Promise.all(toolArray.map(generateParamsInterface));
  const interfacesContent = interfaces.join('\n\n');

  const functionDeclarations = toolArray.map(generateFunctionDeclaration).join('\n\n');
  const functionImplementations = toolArray.map(generateFunctionImplementation).join('\n\n');
  const actionUnion = toolArray.map((t) => `'${t.name}'`).join(' | ');
  const paramTypes = toolArray.map((t) => `${toPascalCase(t.name)}Params`).join(',\n  ');

  // Generate .d.ts content (type definitions + function declarations)
  const dts = `// Auto-generated by StackOneToolSet.generateTypedClient()
// DO NOT EDIT THIS FILE DIRECTLY

import type { DynamicToolClient } from '@stackone/ai';

export type JsonDict = Record<string, unknown>;

${interfacesContent}

export type DynamicToolName = ${actionUnion || "''"};

${functionDeclarations}
`;

  // Generate .ts content (implementation only, imports types from .d.ts)
  const ts = `// Auto-generated by StackOneToolSet.generateTypedClient()
// DO NOT EDIT THIS FILE DIRECTLY

import type { DynamicToolClient } from '@stackone/ai';
import type {
  JsonDict,
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
  const { dts, ts } = await generateTypedClientContent(tools);

  const moduleDir = `${options.outputDir}/${options.name}`;
  const dtsPath = `${moduleDir}/types.d.ts`;
  const tsPath = `${moduleDir}/index.ts`;

  if (!existsSync(moduleDir)) {
    await mkdir(moduleDir, { recursive: true });
  }

  await Promise.all([writeFile(dtsPath, dts), writeFile(tsPath, ts)]);

  return { dtsPath, tsPath };
}
