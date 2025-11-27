#!/usr/bin/env bun
/**
 * Script to generate TypeScript typed SDK from OpenAPI specifications
 *
 * This script generates:
 * 1. TypeScript interfaces for all schemas
 * 2. Typed function signatures for all operations
 * 3. A typed client class for each API
 */
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import { SPECS } from '../src/constants';

// Import all specs
import {
  stackoneSpec,
  crmSpec,
  atsSpec,
  hrisSpec,
  documentsSpec,
  marketingSpec,
  ticketingSpec,
  screeningSpec,
  messagingSpec,
  iamSpec,
  lmsSpec,
} from '../src/openapi/generated';

const OUTPUT_DIR = join(process.cwd(), 'src', 'generated-sdk');

type OpenAPIDocument = OpenAPIV3.Document | OpenAPIV3_1.Document;
type SchemaObject = OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject;
type ReferenceObject = OpenAPIV3.ReferenceObject | OpenAPIV3_1.ReferenceObject;
type ParameterObject = OpenAPIV3.ParameterObject | OpenAPIV3_1.ParameterObject;
type RequestBodyObject = OpenAPIV3.RequestBodyObject | OpenAPIV3_1.RequestBodyObject;

/**
 * Check if object is a reference
 */
function isReference(obj: unknown): obj is ReferenceObject {
  return typeof obj === 'object' && obj !== null && '$ref' in obj;
}

/**
 * Extract reference name from $ref string
 */
function getRefName(ref: string): string {
  const parts = ref.split('/');
  return parts[parts.length - 1];
}

/**
 * Convert a name to PascalCase
 */
function toPascalCase(name: string): string {
  return name
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Convert a name to camelCase
 */
function toCamelCase(name: string): string {
  const pascal = toPascalCase(name);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Convert operationId to function name
 * e.g., "hris_list_employees" -> "listEmployees"
 */
function toFunctionName(operationId: string): string {
  // Remove the prefix (e.g., "hris_")
  const parts = operationId.split('_');
  if (parts.length > 1) {
    // Skip the first part (api name) and convert rest to camelCase
    const functionParts = parts.slice(1);
    return (
      functionParts[0].toLowerCase() +
      functionParts
        .slice(1)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
        .join('')
    );
  }
  return toCamelCase(operationId);
}

/**
 * Map JSON Schema type to TypeScript type
 */
function jsonSchemaTypeToTs(
  schema: SchemaObject | ReferenceObject | undefined,
  schemas: Record<string, SchemaObject | ReferenceObject>,
  visited: Set<string> = new Set()
): string {
  if (!schema) {
    return 'unknown';
  }

  if (isReference(schema)) {
    const refName = getRefName(schema.$ref);
    return refName;
  }

  const s = schema as SchemaObject;

  // Handle nullable
  const nullable = s.nullable ? ' | null' : '';

  // Handle oneOf
  if (s.oneOf) {
    const types = s.oneOf.map((item) => jsonSchemaTypeToTs(item as SchemaObject, schemas, visited));
    return `(${types.join(' | ')})${nullable}`;
  }

  // Handle anyOf
  if (s.anyOf) {
    const types = s.anyOf.map((item) => jsonSchemaTypeToTs(item as SchemaObject, schemas, visited));
    return `(${types.join(' | ')})${nullable}`;
  }

  // Handle allOf
  if (s.allOf) {
    const types = s.allOf.map((item) => jsonSchemaTypeToTs(item as SchemaObject, schemas, visited));
    return `(${types.join(' & ')})${nullable}`;
  }

  // Handle enum
  if (s.enum) {
    const enumValues = s.enum
      .filter((v) => v !== null)
      .map((v) => (typeof v === 'string' ? `'${v}'` : String(v)));
    if (s.nullable || s.enum.includes(null)) {
      enumValues.push('null');
    }
    return enumValues.join(' | ') || 'unknown';
  }

  // Handle type
  switch (s.type) {
    case 'string':
      return `string${nullable}`;
    case 'number':
    case 'integer':
      return `number${nullable}`;
    case 'boolean':
      return `boolean${nullable}`;
    case 'array': {
      const itemType = jsonSchemaTypeToTs(s.items as SchemaObject, schemas, visited);
      return `${itemType}[]${nullable}`;
    }
    case 'object': {
      if (s.additionalProperties === true) {
        return `Record<string, unknown>${nullable}`;
      }
      if (typeof s.additionalProperties === 'object') {
        const valueType = jsonSchemaTypeToTs(s.additionalProperties as SchemaObject, schemas, visited);
        return `Record<string, ${valueType}>${nullable}`;
      }
      if (s.properties) {
        const props = Object.entries(s.properties).map(([key, value]) => {
          const propType = jsonSchemaTypeToTs(value as SchemaObject, schemas, visited);
          const optional = s.required?.includes(key) ? '' : '?';
          const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `'${key}'`;
          return `${safeKey}${optional}: ${propType}`;
        });
        return `{ ${props.join('; ')} }${nullable}`;
      }
      return `Record<string, unknown>${nullable}`;
    }
    default:
      return `unknown${nullable}`;
  }
}

/**
 * Generate TypeScript interface from OpenAPI schema
 */
function generateInterface(
  name: string,
  schema: SchemaObject | ReferenceObject,
  schemas: Record<string, SchemaObject | ReferenceObject>
): string {
  if (isReference(schema)) {
    const refName = getRefName(schema.$ref);
    return `export type ${name} = ${refName};\n`;
  }

  const s = schema as SchemaObject;

  // Handle enum type
  if (s.enum) {
    const enumValues = s.enum
      .filter((v) => v !== null)
      .map((v) => (typeof v === 'string' ? `'${v}'` : String(v)));
    if (s.nullable || s.enum.includes(null)) {
      enumValues.push('null');
    }
    return `export type ${name} = ${enumValues.join(' | ')};\n`;
  }

  // Handle allOf (inheritance/composition)
  if (s.allOf) {
    const types = s.allOf.map((item) => {
      if (isReference(item)) {
        return getRefName(item.$ref);
      }
      return jsonSchemaTypeToTs(item as SchemaObject, schemas);
    });
    return `export type ${name} = ${types.join(' & ')};\n`;
  }

  // Handle object type
  if (s.type === 'object' || s.properties) {
    const lines: string[] = [];
    lines.push(`export interface ${name} {`);

    if (s.properties) {
      for (const [propName, propSchema] of Object.entries(s.properties)) {
        const propType = jsonSchemaTypeToTs(propSchema as SchemaObject, schemas);
        const optional = s.required?.includes(propName) ? '' : '?';
        const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(propName) ? propName : `'${propName}'`;

        // Add JSDoc comment if description exists
        const propSchemaObj = propSchema as SchemaObject;
        if (!isReference(propSchema) && propSchemaObj.description) {
          lines.push(`  /** ${propSchemaObj.description} */`);
        }

        lines.push(`  ${safeKey}${optional}: ${propType};`);
      }
    }

    if (s.additionalProperties) {
      const valueType =
        s.additionalProperties === true
          ? 'unknown'
          : jsonSchemaTypeToTs(s.additionalProperties as SchemaObject, schemas);
      lines.push(`  [key: string]: ${valueType};`);
    }

    lines.push('}');
    return lines.join('\n') + '\n';
  }

  // Handle primitive types as type aliases
  const tsType = jsonSchemaTypeToTs(schema, schemas);
  return `export type ${name} = ${tsType};\n`;
}

/**
 * Generate all interfaces from schemas
 */
function generateAllInterfaces(
  schemas: Record<string, SchemaObject | ReferenceObject>
): string {
  const lines: string[] = [];
  lines.push('// Auto-generated TypeScript interfaces from OpenAPI schemas');
  lines.push('// DO NOT EDIT THIS FILE DIRECTLY\n');

  for (const [name, schema] of Object.entries(schemas)) {
    lines.push(generateInterface(name, schema, schemas));
  }

  return lines.join('\n');
}

/**
 * Parse parameters from an operation
 */
interface ParsedParameter {
  name: string;
  tsName: string;
  type: string;
  required: boolean;
  description?: string;
  location: 'path' | 'query' | 'header' | 'body';
}

function parseParameters(
  operation: OpenAPIV3.OperationObject | OpenAPIV3_1.OperationObject,
  schemas: Record<string, SchemaObject | ReferenceObject>
): ParsedParameter[] {
  const params: ParsedParameter[] = [];

  // Parse path/query/header parameters
  if (operation.parameters) {
    for (const param of operation.parameters) {
      if (isReference(param)) continue;

      const p = param as ParameterObject;
      // Skip deprecated parameters
      if (p.deprecated) continue;
      // Skip x-account-id as it will be handled by the client
      if (p.name === 'x-account-id') continue;

      const paramSchema = p.schema as SchemaObject | undefined;
      const tsType = jsonSchemaTypeToTs(paramSchema, schemas);

      params.push({
        name: p.name,
        tsName: toCamelCase(p.name.replace(/-/g, '_')),
        type: tsType,
        required: p.required ?? false,
        description: p.description,
        location: p.in as 'path' | 'query' | 'header',
      });
    }
  }

  // Parse request body
  if (operation.requestBody && !isReference(operation.requestBody)) {
    const requestBody = operation.requestBody as RequestBodyObject;
    const content = requestBody.content?.['application/json'];

    if (content?.schema) {
      const bodyType = jsonSchemaTypeToTs(content.schema as SchemaObject, schemas);
      params.push({
        name: 'body',
        tsName: 'body',
        type: bodyType,
        required: requestBody.required ?? false,
        description: requestBody.description,
        location: 'body',
      });
    }
  }

  return params;
}

/**
 * Get response type from operation
 */
function getResponseType(
  operation: OpenAPIV3.OperationObject | OpenAPIV3_1.OperationObject,
  schemas: Record<string, SchemaObject | ReferenceObject>
): string {
  const successResponse = operation.responses?.['200'] || operation.responses?.['201'];

  if (!successResponse || isReference(successResponse)) {
    return 'unknown';
  }

  const response = successResponse as OpenAPIV3.ResponseObject;
  const content = response.content?.['application/json'];

  if (!content?.schema) {
    return 'void';
  }

  return jsonSchemaTypeToTs(content.schema as SchemaObject, schemas);
}

/**
 * Generate a typed function for an operation
 */
interface GeneratedFunction {
  name: string;
  signature: string;
  implementation: string;
  description?: string;
}

function generateFunction(
  operationId: string,
  operation: OpenAPIV3.OperationObject | OpenAPIV3_1.OperationObject,
  path: string,
  method: string,
  schemas: Record<string, SchemaObject | ReferenceObject>
): GeneratedFunction {
  const functionName = toFunctionName(operationId);
  const params = parseParameters(operation, schemas);
  const responseType = getResponseType(operation, schemas);

  // Separate required and optional parameters
  const requiredParams = params.filter((p) => p.required);
  const optionalParams = params.filter((p) => !p.required);

  // Build params interface name
  const paramsInterfaceName = `${toPascalCase(operationId)}Params`;

  // Generate params interface
  const paramsInterface = params.length > 0
    ? generateParamsInterface(paramsInterfaceName, params)
    : null;

  // Generate function signature
  const paramArg = params.length > 0
    ? `params${requiredParams.length === 0 ? '?' : ''}: ${paramsInterfaceName}`
    : '';

  const signature = `${functionName}(${paramArg}): Promise<${responseType}>`;

  // Generate implementation
  const implementation = generateFunctionImplementation(
    functionName,
    params,
    paramsInterfaceName,
    path,
    method,
    responseType,
    requiredParams.length === 0
  );

  return {
    name: functionName,
    signature,
    implementation: paramsInterface ? `${paramsInterface}\n${implementation}` : implementation,
    description: operation.summary || operation.description,
  };
}

/**
 * Generate params interface for a function
 */
function generateParamsInterface(name: string, params: ParsedParameter[]): string {
  const lines: string[] = [];
  lines.push(`export interface ${name} {`);

  for (const param of params) {
    if (param.description) {
      lines.push(`  /** ${param.description} */`);
    }
    const optional = param.required ? '' : '?';
    lines.push(`  ${param.tsName}${optional}: ${param.type};`);
  }

  lines.push('}');
  return lines.join('\n');
}

/**
 * Generate function implementation
 */
function generateFunctionImplementation(
  functionName: string,
  params: ParsedParameter[],
  paramsInterfaceName: string,
  path: string,
  method: string,
  responseType: string,
  paramsOptional: boolean
): string {
  const pathParams = params.filter((p) => p.location === 'path');
  const queryParams = params.filter((p) => p.location === 'query');
  const headerParams = params.filter((p) => p.location === 'header');
  const bodyParam = params.find((p) => p.location === 'body');

  const lines: string[] = [];

  // Function signature
  const paramArg = params.length > 0
    ? `params${paramsOptional ? '?' : ''}: ${paramsInterfaceName}`
    : '';
  lines.push(`  async ${functionName}(${paramArg}): Promise<${responseType}> {`);

  // Build URL with path parameters
  let urlExpr = `\`\${this.baseUrl}${path}\``;
  if (pathParams.length > 0) {
    for (const param of pathParams) {
      urlExpr = urlExpr.replace(`{${param.name}}`, `\${params${paramsOptional ? '?' : ''}.${param.tsName}}`);
    }
  }
  lines.push(`    let url = ${urlExpr};`);

  // Add query parameters
  if (queryParams.length > 0) {
    lines.push('    const queryParts: string[] = [];');
    for (const param of queryParams) {
      const accessor = `params${paramsOptional ? '?' : ''}.${param.tsName}`;
      lines.push(`    if (${accessor} !== undefined) {`);
      if (param.type.includes('object') || param.type.includes('Record')) {
        // Handle deep object serialisation
        lines.push(`      for (const [key, value] of Object.entries(${accessor} as Record<string, unknown>)) {`);
        lines.push(`        if (value !== undefined && value !== null) {`);
        lines.push(`          queryParts.push(\`${param.name}[\${key}]=\${encodeURIComponent(String(value))}\`);`);
        lines.push('        }');
        lines.push('      }');
      } else {
        lines.push(`      queryParts.push(\`${param.name}=\${encodeURIComponent(String(${accessor}))}\`);`);
      }
      lines.push('    }');
    }
    lines.push("    if (queryParts.length > 0) url += `?${queryParts.join('&')}`;");
  }

  // Build headers
  lines.push('    const headers: Record<string, string> = {');
  lines.push("      ...this.headers,");
  if (bodyParam) {
    lines.push("      'Content-Type': 'application/json',");
  }
  lines.push('    };');

  // Add header parameters
  if (headerParams.length > 0) {
    for (const param of headerParams) {
      const accessor = `params${paramsOptional ? '?' : ''}.${param.tsName}`;
      const safeHeaderKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(param.name)
        ? `headers.${param.name}`
        : `headers['${param.name}']`;
      lines.push(`    if (${accessor} !== undefined) {`);
      lines.push(`      ${safeHeaderKey} = String(${accessor});`);
      lines.push('    }');
    }
  }

  // Build fetch options
  lines.push('    const options: RequestInit = {');
  lines.push(`      method: '${method.toUpperCase()}',`);
  lines.push('      headers,');
  if (bodyParam) {
    lines.push(`      body: params${paramsOptional ? '?' : ''}.${bodyParam.tsName} ? JSON.stringify(params${paramsOptional ? '!' : ''}.${bodyParam.tsName}) : undefined,`);
  }
  lines.push('    };');

  // Execute fetch
  lines.push('    const response = await fetch(url, options);');
  lines.push('    if (!response.ok) {');
  lines.push('      const errorBody = await response.text();');
  lines.push(`      throw new Error(\`API error \${response.status}: \${errorBody}\`);`);
  lines.push('    }');

  // Return response
  if (responseType === 'void') {
    lines.push('    return;');
  } else {
    lines.push(`    return response.json() as Promise<${responseType}>;`);
  }

  lines.push('  }');

  return lines.join('\n');
}

/**
 * Generate client class for an API
 */
function generateClient(
  specName: string,
  spec: OpenAPIDocument,
  schemas: Record<string, SchemaObject | ReferenceObject>
): string {
  const className = `${toPascalCase(specName)}Client`;
  const functions: GeneratedFunction[] = [];

  // Extract all operations
  const paths = spec.paths || {};
  for (const [path, pathItem] of Object.entries(paths)) {
    if (!pathItem) continue;

    const methods = ['get', 'post', 'put', 'delete', 'patch'] as const;
    for (const method of methods) {
      const operation = (pathItem as Record<string, unknown>)[method] as
        | OpenAPIV3.OperationObject
        | undefined;
      if (!operation || !operation.operationId) continue;

      // Skip deprecated operations
      if (operation.deprecated) continue;

      const func = generateFunction(operation.operationId, operation, path, method, schemas);
      functions.push(func);
    }
  }

  // Generate client class
  const lines: string[] = [];
  lines.push(`/**`);
  lines.push(` * ${toPascalCase(specName)} API Client`);
  lines.push(` * Auto-generated from OpenAPI specification`);
  lines.push(` */`);
  lines.push(`export class ${className} {`);
  lines.push('  private baseUrl: string;');
  lines.push('  private headers: Record<string, string>;');
  lines.push('');
  lines.push('  constructor(config: StackOneClientConfig) {');
  lines.push("    this.baseUrl = config.baseUrl || 'https://api.stackone.com';");
  lines.push('    const authToken = Buffer.from(`${config.apiKey}:`).toString(\'base64\');');
  lines.push('    this.headers = {');
  lines.push("      'Authorization': `Basic ${authToken}`,");
  lines.push("      'x-account-id': config.accountId,");
  lines.push('      ...config.headers,');
  lines.push('    };');
  lines.push('  }');
  lines.push('');

  // Add all function implementations
  for (const func of functions) {
    if (func.description) {
      lines.push(`  /**`);
      lines.push(`   * ${func.description}`);
      lines.push(`   */`);
    }
    // The implementation includes the params interface, so extract just the function
    const implLines = func.implementation.split('\n');
    const funcStart = implLines.findIndex((l) => l.includes('async '));
    if (funcStart >= 0) {
      // First output the params interface if it exists
      if (funcStart > 0) {
        // The params interface is before the function
        // We'll output these at the top of the file instead
      }
      lines.push(implLines.slice(funcStart).join('\n'));
    } else {
      lines.push(func.implementation);
    }
    lines.push('');
  }

  lines.push('}');

  // Collect all params interfaces
  const paramsInterfaces: string[] = [];
  for (const func of functions) {
    const implLines = func.implementation.split('\n');
    const funcStart = implLines.findIndex((l) => l.includes('async '));
    if (funcStart > 0) {
      paramsInterfaces.push(implLines.slice(0, funcStart).join('\n'));
    }
  }

  return paramsInterfaces.join('\n\n') + '\n\n' + lines.join('\n');
}

/**
 * Generate complete SDK file for a spec
 */
function generateSdkFile(specName: string, spec: OpenAPIDocument): string {
  const schemas = (spec.components?.schemas || {}) as Record<
    string,
    SchemaObject | ReferenceObject
  >;

  const lines: string[] = [];
  lines.push('// Auto-generated TypeScript SDK from OpenAPI specification');
  lines.push('// DO NOT EDIT THIS FILE DIRECTLY');
  lines.push('');
  lines.push("import type { StackOneClientConfig } from './types';");
  lines.push('');

  // Generate interfaces
  lines.push('// ============================================================');
  lines.push('// Type Definitions');
  lines.push('// ============================================================');
  lines.push('');
  lines.push(generateAllInterfaces(schemas));

  // Generate client
  lines.push('');
  lines.push('// ============================================================');
  lines.push('// Client Class');
  lines.push('// ============================================================');
  lines.push('');
  lines.push(generateClient(specName, spec, schemas));

  return lines.join('\n');
}

/**
 * Generate shared types file
 */
function generateTypesFile(): string {
  return `// Auto-generated shared types
// DO NOT EDIT THIS FILE DIRECTLY

/**
 * Configuration for StackOne API clients
 */
export interface StackOneClientConfig {
  /** StackOne API key */
  apiKey: string;
  /** Account ID for the linked account */
  accountId: string;
  /** Base URL for the API (defaults to https://api.stackone.com) */
  baseUrl?: string;
  /** Additional headers to include in requests */
  headers?: Record<string, string>;
}
`;
}

/**
 * Generate index file - only export client classes to avoid type conflicts
 */
function generateIndexFile(specNames: string[]): string {
  const lines: string[] = [];
  lines.push('// Auto-generated index file');
  lines.push('// DO NOT EDIT THIS FILE DIRECTLY');
  lines.push('');
  lines.push("export * from './types';");
  lines.push('');
  lines.push('// Export client classes from each module');
  lines.push('// Types are available via each module namespace to avoid conflicts');

  for (const name of specNames) {
    const className = `${toPascalCase(name)}Client`;
    lines.push(`export { ${className} } from './${name}';`);
  }

  lines.push('');
  lines.push('// Re-export namespaces for accessing types');
  for (const name of specNames) {
    lines.push(`export * as ${toCamelCase(name)} from './${name}';`);
  }

  return lines.join('\n') + '\n';
}

/**
 * Main function
 */
async function main(): Promise<void> {
  console.log('Generating TypeScript SDK from OpenAPI specifications...');

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true });
  }

  // Map spec names to specs
  const specMap: Record<string, OpenAPIDocument> = {
    stackone: stackoneSpec as unknown as OpenAPIDocument,
    crm: crmSpec as unknown as OpenAPIDocument,
    ats: atsSpec as unknown as OpenAPIDocument,
    hris: hrisSpec as unknown as OpenAPIDocument,
    documents: documentsSpec as unknown as OpenAPIDocument,
    marketing: marketingSpec as unknown as OpenAPIDocument,
    ticketing: ticketingSpec as unknown as OpenAPIDocument,
    screening: screeningSpec as unknown as OpenAPIDocument,
    messaging: messagingSpec as unknown as OpenAPIDocument,
    iam: iamSpec as unknown as OpenAPIDocument,
    lms: lmsSpec as unknown as OpenAPIDocument,
  };

  // Generate types file
  const typesContent = generateTypesFile();
  await writeFile(join(OUTPUT_DIR, 'types.ts'), typesContent);
  console.log('✓ Generated types.ts');

  // Generate SDK for each spec
  for (const specName of SPECS) {
    const spec = specMap[specName];
    if (!spec) {
      console.warn(`⚠ Spec not found: ${specName}`);
      continue;
    }

    try {
      const sdkContent = generateSdkFile(specName, spec);
      await writeFile(join(OUTPUT_DIR, `${specName}.ts`), sdkContent);
      console.log(`✓ Generated ${specName}.ts`);
    } catch (error) {
      console.error(`✗ Failed to generate ${specName}.ts:`, error);
    }
  }

  // Generate index file
  const indexContent = generateIndexFile(SPECS);
  await writeFile(join(OUTPUT_DIR, 'index.ts'), indexContent);
  console.log('✓ Generated index.ts');

  console.log('Done generating TypeScript SDK');
}

if (import.meta.main) {
  main();
}
