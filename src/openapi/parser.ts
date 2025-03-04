import fs from 'node:fs';
import type { JSONSchema7TypeName, JSONSchema7 as JsonSchema } from 'json-schema';
import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import { ParameterLocation, type ToolDefinition } from '../models';

// Custom type that includes 'file' as a valid schema type
type ExtendedSchemaType = JSONSchema7TypeName | 'file';

// Extended schema type that includes 'file' as a valid type
interface ExtendedJsonSchema extends Omit<JsonSchema, 'type'> {
  type?: ExtendedSchemaType | ExtendedSchemaType[];
}

// Define a type for OpenAPI document
type OpenAPIDocument = OpenAPIV3.Document | OpenAPIV3_1.Document;

// Define a type for schema objects
type SchemaObject = OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject;

// Define HTTP methods type
type HttpMethod = 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace';

export class OpenAPIParser {
  private spec: OpenAPIDocument;
  private baseUrl: string;

  /**
   * Create a new OpenAPI parser
   * @param specPathOrObject Path to the OpenAPI specification file or the spec object directly
   * @param customBaseUrl Optional custom base URL to override the one in the spec
   */
  constructor(specPathOrObject: string | OpenAPIDocument, customBaseUrl?: string) {
    // Initialize spec either from file or directly from object
    if (typeof specPathOrObject === 'string') {
      const specContent = fs.readFileSync(specPathOrObject, 'utf-8');
      this.spec = JSON.parse(specContent) as OpenAPIDocument;
    } else {
      this.spec = specPathOrObject;
    }

    if (customBaseUrl) {
      // Use the provided custom base URL
      this.baseUrl = customBaseUrl;
    } else {
      // Get base URL from servers array or default to stackone API
      const servers = this.spec.servers || [{ url: 'https://api.stackone.com' }];
      this.baseUrl =
        Array.isArray(servers) && servers.length > 0 ? servers[0].url : 'https://api.stackone.com';
    }
  }

  /**
   * Create a parser from a JSON string
   * @param jsonString JSON string containing the OpenAPI spec
   * @param customBaseUrl Optional custom base URL to override the one in the spec
   * @returns A new OpenAPIParser instance
   */
  static fromString(jsonString: string, customBaseUrl?: string): OpenAPIParser {
    const spec = JSON.parse(jsonString) as OpenAPIDocument;
    return new OpenAPIParser(spec, customBaseUrl);
  }

  /**
   * Check if a schema represents a file upload
   */
  private _isFileType(schema: JsonSchema): boolean {
    return schema.type === 'string' && schema.format === 'binary';
  }

  /**
   * Convert a binary string schema to a file type
   */
  private _convertToFileType(schema: JsonSchema): void {
    if (this._isFileType(schema)) {
      (schema as ExtendedJsonSchema).type = 'file';
    }
  }

  /**
   * Process schema properties to handle file uploads
   */
  private _handleFileProperties(schema: JsonSchema): void {
    if (!schema.properties) {
      return;
    }

    for (const propName of Object.keys(schema.properties)) {
      const propSchema = schema.properties[propName] as JsonSchema;

      // Handle direct file uploads
      this._convertToFileType(propSchema);

      // Handle array of files
      if (propSchema.type === 'array' && propSchema.items) {
        this._convertToFileType(propSchema.items as JsonSchema);
      }
    }
  }

  /**
   * Resolve a JSON schema reference in the OpenAPI spec
   */
  private _resolveSchemaRef(ref: string, visited: Set<string> = new Set()): JsonSchema {
    if (!ref.startsWith('#/')) {
      throw new Error(`Only local references are supported: ${ref}`);
    }

    if (visited.has(ref)) {
      throw new Error(`Circular reference detected: ${ref}`);
    }

    visited.add(ref);

    const parts = ref.split('/').slice(1); // Skip the '#'
    let current: unknown = this.spec;
    for (const part of parts) {
      if (typeof current === 'object' && current !== null) {
        current = (current as Record<string, unknown>)[part];
      } else {
        throw new Error(`Invalid reference path: ${ref}`);
      }
    }

    // After getting the referenced schema, resolve it fully
    return this._resolveSchema(current as SchemaObject, visited);
  }

  /**
   * Resolve all references in a schema, preserving structure
   */
  private _resolveSchema(
    schema: SchemaObject | unknown,
    visited: Set<string> = new Set()
  ): JsonSchema {
    // Handle primitive types (string, number, etc)
    if (typeof schema !== 'object' || schema === null) {
      return schema as JsonSchema;
    }

    if (Array.isArray(schema)) {
      return schema.map((item) =>
        this._resolveSchema(item, new Set(visited))
      ) as unknown as JsonSchema;
    }

    // Handle direct reference
    if (typeof schema === 'object' && '$ref' in schema && typeof schema.$ref === 'string') {
      const resolved = this._resolveSchemaRef(schema.$ref, visited);
      if (typeof resolved !== 'object' || resolved === null) {
        return resolved;
      }
      // Merge any additional properties from the original schema
      return {
        ...resolved,
        ...Object.fromEntries(Object.entries(schema).filter(([k]) => k !== '$ref')),
      };
    }

    // Handle allOf combinations
    if (typeof schema === 'object' && 'allOf' in schema) {
      const schemaObj = schema as OpenAPIV3.SchemaObject;
      // Create a new object without the allOf property to avoid type issues
      const { allOf, ...restSchema } = schemaObj;
      const mergedSchema: JsonSchema = restSchema as JsonSchema;

      // Merge all schemas in allOf array
      if (Array.isArray(allOf)) {
        for (const subSchema of allOf) {
          const resolved = this._resolveSchema(subSchema, new Set(visited));
          if (typeof resolved !== 'object' || resolved === null) {
            continue;
          }

          // Merge properties
          if ('properties' in resolved) {
            if (!mergedSchema.properties) {
              mergedSchema.properties = {};
            }
            mergedSchema.properties = {
              ...mergedSchema.properties,
              ...resolved.properties,
            };
          }

          // Merge type and other fields
          for (const [key, value] of Object.entries(resolved)) {
            if (key !== 'properties' && !(key in mergedSchema)) {
              (mergedSchema as Record<string, unknown>)[key] = value;
            }
          }
        }
      }

      return mergedSchema;
    }

    // Recursively resolve all nested objects and arrays
    const resolved: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(schema)) {
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          resolved[key] = value.map((item) => this._resolveSchema(item, new Set(visited)));
        } else {
          resolved[key] = this._resolveSchema(value, new Set(visited));
        }
      } else {
        resolved[key] = value;
      }
    }

    return resolved as JsonSchema;
  }

  /**
   * Parse schema from content object for a specific content type
   */
  private _parseContentSchema(
    contentType: string,
    content: Record<string, OpenAPIV3.MediaTypeObject>
  ): [JsonSchema | null, string | null] {
    if (!(contentType in content)) {
      return [null, null];
    }

    const typeContent = content[contentType];
    if (typeof typeContent !== 'object' || typeContent === null) {
      return [null, null];
    }

    const schema = typeContent.schema || {};
    const resolved = this._resolveSchema(schema);

    if (typeof resolved !== 'object' || resolved === null) {
      return [null, null];
    }

    return [resolved, contentType.split('/').pop() || null];
  }

  /**
   * Parse request body schema and content type from operation
   */
  private _parseRequestBody(
    operation: OpenAPIV3.OperationObject
  ): [JsonSchema | null, string | null] {
    const requestBody = operation.requestBody;
    if (!requestBody) {
      return [null, null];
    }

    // Resolve reference if needed
    let resolvedRequestBody: OpenAPIV3.RequestBodyObject;
    if ('$ref' in requestBody) {
      const ref = requestBody.$ref as string;
      const parts = ref.split('/').slice(1);
      let current: unknown = this.spec;
      for (const part of parts) {
        if (typeof current === 'object' && current !== null) {
          current = (current as Record<string, unknown>)[part];
        } else {
          throw new Error(`Invalid reference path: ${ref}`);
        }
      }
      resolvedRequestBody = current as OpenAPIV3.RequestBodyObject;
    } else {
      resolvedRequestBody = requestBody as OpenAPIV3.RequestBodyObject;
    }

    const content = resolvedRequestBody.content || {};

    // Try JSON first
    let [schema, bodyType] = this._parseContentSchema('application/json', content);
    if (schema) {
      return [schema, bodyType];
    }

    // Try multipart form-data (file uploads)
    [schema, bodyType] = this._parseContentSchema('multipart/form-data', content);
    if (schema) {
      this._handleFileProperties(schema);
      return [schema, 'multipart'];
    }

    // Try form-urlencoded
    [schema, bodyType] = this._parseContentSchema('application/x-www-form-urlencoded', content);
    if (schema) {
      return [schema, 'form'];
    }

    return [null, null];
  }

  /**
   * Determine the parameter location based on schema type
   */
  private _getParameterLocation(propSchema: JsonSchema): ParameterLocation {
    if ((propSchema as ExtendedJsonSchema).type === 'file') {
      return ParameterLocation.FILE;
    }
    if (
      propSchema.type === 'array' &&
      propSchema.items &&
      (propSchema.items as ExtendedJsonSchema).type === 'file'
    ) {
      return ParameterLocation.FILE;
    }
    return ParameterLocation.BODY;
  }

  /**
   * Parse OpenAPI spec into tool definitions
   */
  parseTools(): Record<string, ToolDefinition> {
    const tools: Record<string, ToolDefinition> = {};

    const paths = this.spec.paths || {};
    for (const [path, pathItem] of Object.entries(paths)) {
      if (!pathItem) continue;

      // Handle operations (get, post, put, delete, etc.)
      const operations = this.extractOperations(pathItem);

      for (const [method, operation] of operations) {
        // Check for operationId - this is required
        if (!operation.operationId) {
          throw new Error(
            `Operation ID is required for tool parsing: ${method.toUpperCase()} ${path}`
          );
        }

        const name = operation.operationId;

        // Parse request body if present
        const [requestBodySchema, bodyType] = this._parseRequestBody(operation);

        // Track parameter locations and properties
        const parameterLocations: Record<string, ParameterLocation> = {};
        const properties: Record<string, JsonSchema> = {};

        // Parse parameters
        for (const param of operation.parameters || []) {
          // Resolve parameter reference if needed
          const resolvedParam = this.resolveParameter(param);
          if (!resolvedParam) continue;

          const paramName = resolvedParam.name;
          const paramLocation = resolvedParam.in; // header, query, path, cookie
          parameterLocations[paramName] = paramLocation as ParameterLocation;

          // Add to properties for tool parameters
          const schema = { ...(resolvedParam.schema || {}) };
          if ('description' in resolvedParam) {
            (schema as Record<string, unknown>).description = resolvedParam.description;
          }
          properties[paramName] = this._resolveSchema(schema);
        }

        // Add request body properties if present
        if (requestBodySchema && typeof requestBodySchema === 'object') {
          const bodyProps = requestBodySchema.properties || {};
          for (const [propName, propSchema] of Object.entries(bodyProps)) {
            properties[propName] = propSchema as JsonSchema;
            parameterLocations[propName] = this._getParameterLocation(propSchema as JsonSchema);
          }
        }

        // Create tool definition
        tools[name] = {
          description: operation.summary || '',
          parameters: {
            type: 'object',
            properties,
          },
          execute: {
            method: method.toUpperCase(),
            url: `${this.baseUrl}${path}`,
            name,
            headers: {},
            parameterLocations,
            bodyType: bodyType || undefined,
          },
        };
      }
    }

    return tools;
  }

  /**
   * Extract operations from a path item
   */
  private extractOperations(
    pathItem: OpenAPIV3.PathItemObject
  ): [string, OpenAPIV3.OperationObject][] {
    const operations: [string, OpenAPIV3.OperationObject][] = [];

    // Handle HTTP methods
    const methods: HttpMethod[] = [
      'get',
      'put',
      'post',
      'delete',
      'options',
      'head',
      'patch',
      'trace',
    ];
    for (const method of methods) {
      const operation = (pathItem as Record<string, unknown>)[method] as
        | OpenAPIV3.OperationObject
        | undefined;
      if (operation) {
        operations.push([method, operation]);
      }
    }

    return operations;
  }

  /**
   * Resolve a parameter reference
   */
  private resolveParameter(
    param: OpenAPIV3.ParameterObject | OpenAPIV3.ReferenceObject
  ): OpenAPIV3.ParameterObject | null {
    if ('$ref' in param) {
      const ref = param.$ref as string;
      const parts = ref.split('/').slice(1);
      let current: unknown = this.spec;
      for (const part of parts) {
        if (typeof current === 'object' && current !== null) {
          current = (current as Record<string, unknown>)[part];
        } else {
          throw new Error(`Invalid reference path: ${ref}`);
        }
      }
      return current as OpenAPIV3.ParameterObject;
    }
    return param;
  }
}
