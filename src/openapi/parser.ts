import type { JSONSchema7 as JsonSchema } from 'json-schema';
import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import { ParameterLocation, type ToolDefinition } from '../tools';

// Define a type for OpenAPI document
type OpenAPIDocument = OpenAPIV3.Document | OpenAPIV3_1.Document;

// Define a type for schema objects
type SchemaObject = OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject;

// Define HTTP methods type
type HttpMethod = 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace';

/**
 * Parser for OpenAPI specifications
 */
export class OpenAPIParser {
  _spec: OpenAPIDocument;
  _baseUrl: string;

  /**
   * Create a new OpenAPIParser
   * @param spec The OpenAPI specification object
   * @param customBaseUrl Optional custom base URL to use for all operations
   */
  constructor(spec: OpenAPIDocument, customBaseUrl?: string) {
    this._spec = spec;
    this._baseUrl = customBaseUrl || this.determineBaseUrl();
  }

  /**
   * Determine the base URL from the servers array in the OpenAPI spec
   * @returns The base URL to use for all operations
   */
  private determineBaseUrl(): string {
    // Extract base URL from servers if available
    const servers = this._spec.servers || [];
    return servers.length > 0 ? servers[0].url : 'https://api.stackone.com';
  }

  /**
   * Create a parser from a JSON string
   * @param specString OpenAPI specification as a JSON string
   * @param customBaseUrl Optional custom base URL to use for all tools
   * @returns A new OpenAPIParser instance
   */
  public static fromString(specString: string, customBaseUrl?: string): OpenAPIParser {
    const spec = JSON.parse(specString) as OpenAPIDocument;
    return new OpenAPIParser(spec, customBaseUrl);
  }

  /**
   * Resolve a JSON schema reference in the OpenAPI spec
   */
  public resolveSchemaRef(ref: string, visited: Set<string> = new Set()): JsonSchema {
    if (!ref.startsWith('#/')) {
      const errorMsg = `Only local references are supported: ${ref}`;
      throw new Error(errorMsg);
    }

    if (visited.has(ref)) {
      const errorMsg = `Circular reference detected: ${ref}`;
      throw new Error(errorMsg);
    }

    // Create a new set with the current ref added to avoid modifying the original set
    const newVisited = new Set(visited);
    newVisited.add(ref);

    const parts = ref.split('/').slice(1); // Skip the '#'
    let current: unknown = this._spec;
    for (const part of parts) {
      if (typeof current === 'object' && current !== null) {
        current = (current as Record<string, unknown>)[part];
      } else {
        const errorMsg = `Invalid reference path: ${ref}`;
        throw new Error(errorMsg);
      }
    }

    // After getting the referenced schema, resolve it fully
    const resolved = this.resolveSchema(current as SchemaObject, newVisited);
    return resolved;
  }

  /**
   * Resolve all references in a schema, preserving structure
   */
  public resolveSchema(
    schema: SchemaObject | unknown,
    visited: Set<string> = new Set()
  ): JsonSchema {
    // Handle primitive types (string, number, etc)
    if (typeof schema !== 'object' || schema === null) {
      return schema as JsonSchema;
    }

    if (Array.isArray(schema)) {
      return schema.map((item) =>
        this.resolveSchema(item, new Set(visited))
      ) as unknown as JsonSchema;
    }

    // Handle direct reference
    if (typeof schema === 'object' && '$ref' in schema && typeof schema.$ref === 'string') {
      const resolved = this.resolveSchemaRef(schema.$ref, visited);
      if (typeof resolved !== 'object' || resolved === null) {
        return resolved;
      }
      // Merge any additional properties from the original schema
      // Create a new object to avoid modifying the resolved schema
      const result = {
        ...JSON.parse(JSON.stringify(resolved)),
        ...Object.fromEntries(Object.entries(schema).filter(([k]) => k !== '$ref')),
      };
      return result as JsonSchema;
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
          const resolved = this.resolveSchema(subSchema, new Set(visited));
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
      // Skip vendor extensions
      if (key.startsWith('x-')) {
        continue;
      }

      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          // Handle arrays
          resolved[key] = value.map((item) => this.resolveSchema(item, new Set(visited)));
        } else {
          // Handle objects
          resolved[key] = this.resolveSchema(value, new Set(visited));
        }
      } else {
        // Handle primitive values
        resolved[key] = value;
      }
    }

    return resolved as JsonSchema;
  }

  /**
   * Parse content schema for a specific content type
   */
  public parseContentSchema(
    contentType: string,
    content: Record<string, OpenAPIV3.MediaTypeObject>
  ): [JsonSchema | null, string | null] {
    // Check if the content type exists in the content object
    if (!content[contentType]) {
      return [null, null];
    }

    // Get the schema for the content type
    const mediaType = content[contentType];
    const schema = mediaType.schema;

    // Only handle JSON content types for now
    if (contentType === 'application/json') {
      return [this.resolveSchema(schema), 'json'];
    }
    if (contentType === 'multipart/form-data') {
      return [this.resolveSchema(schema), 'form-data'];
    }
    if (contentType === 'application/x-www-form-urlencoded') {
      return [this.resolveSchema(schema), 'form'];
    }

    // Return null for other content types
    return [null, null];
  }

  /**
   * Resolve a request body reference
   */
  public resolveRequestBodyRef(ref: string): OpenAPIV3.RequestBodyObject | null {
    if (!ref.startsWith('#/components/requestBodies/')) {
      return null;
    }

    const name = ref.split('/').pop() as string;
    const requestBodies = this._spec.components?.requestBodies;
    if (!requestBodies || !(name in requestBodies)) {
      return null;
    }

    const refBody = requestBodies[name];
    if ('$ref' in refBody) {
      // Don't support nested references for simplicity
      return null;
    }

    return refBody as OpenAPIV3.RequestBodyObject;
  }

  /**
   * Parse request body from an operation
   */
  public parseRequestBody(
    operation: OpenAPIV3.OperationObject
  ): [JsonSchema | null, string | null] {
    if (!operation.requestBody) {
      return [null, null];
    }

    let requestBody = operation.requestBody as OpenAPIV3.RequestBodyObject;

    // Handle request body reference
    if ('$ref' in operation.requestBody) {
      const refBody = this.resolveRequestBodyRef(
        (operation.requestBody as OpenAPIV3.ReferenceObject).$ref
      );
      if (!refBody) {
        return [null, null];
      }
      requestBody = refBody as OpenAPIV3.RequestBodyObject;
    }

    // Check for content
    if (!requestBody.content) {
      return [null, null];
    }

    // Try to parse JSON content first
    if (requestBody.content['application/json']) {
      return this.parseContentSchema('application/json', requestBody.content);
    }

    // Then try multipart/form-data
    if (requestBody.content['multipart/form-data']) {
      return this.parseContentSchema('multipart/form-data', requestBody.content);
    }

    // Then try application/x-www-form-urlencoded
    if (requestBody.content['application/x-www-form-urlencoded']) {
      return this.parseContentSchema('application/x-www-form-urlencoded', requestBody.content);
    }

    // No supported content type found
    return [null, null];
  }

  /**
   * Get the parameter location from a property schema
   * @param propSchema The schema of the property
   * @returns The parameter location (HEADER, QUERY, PATH, or BODY)
   */
  public getParameterLocation(
    propSchema: OpenAPIV3.ParameterObject | Record<string, unknown>
  ): ParameterLocation {
    // If the parameter has an explicit 'in' property, use that
    if (propSchema && typeof propSchema === 'object' && 'in' in propSchema) {
      const location = propSchema.in;

      switch (location) {
        case 'header':
          return ParameterLocation.HEADER;
        case 'query':
          return ParameterLocation.QUERY;
        case 'path':
          return ParameterLocation.PATH;
        case 'cookie': // Cookies are sent in headers
          return ParameterLocation.HEADER;
        default:
          return ParameterLocation.BODY;
      }
    }

    // Default to BODY for request body properties
    return ParameterLocation.BODY;
  }

  /**
   * Parse OpenAPI spec into tool definitions
   */
  public parseTools(): Record<string, ToolDefinition> {
    // Create a new empty tools object to ensure no tools from previous tests are included
    const tools: Record<string, ToolDefinition> = {};

    try {
      const paths = this._spec.paths || {};

      for (const [path, pathItem] of Object.entries(paths)) {
        if (!pathItem) {
          continue;
        }

        // Handle operations (get, post, put, delete, etc.)
        const operations = this.extractOperations(pathItem);

        for (const [method, operation] of operations) {
          // Check for operationId - this is required
          if (!operation.operationId) {
            const errorMsg = `Operation ID is required for tool parsing: ${method.toUpperCase()} ${path}`;
            throw new Error(errorMsg);
          }

          const name = operation.operationId;

          try {
            // Parse request body if present
            const [requestBodySchema, bodyType] = this.parseRequestBody(operation);

            // Track parameter locations and properties
            // Create fresh objects for each operation to avoid shared state issues
            const parameterLocations: Record<string, ParameterLocation> = {};
            const properties: Record<string, JsonSchema> = {};
            let requiredParams: string[] = [];

            // Parse parameters
            for (const param of operation.parameters || []) {
              try {
                // Resolve parameter reference if needed
                const resolvedParam = this.resolveParameter(param);
                if (!resolvedParam) {
                  continue;
                }

                const paramName = resolvedParam.name;
                const paramLocation = resolvedParam.in; // header, query, path, cookie
                parameterLocations[paramName] = paramLocation as ParameterLocation;

                // Add to properties for tool parameters
                const schema = { ...(resolvedParam.schema || {}) };
                if ('description' in resolvedParam) {
                  (schema as Record<string, unknown>).description = resolvedParam.description;
                }
                properties[paramName] = this.resolveSchema(schema);

                // Add to required params if required
                // Special case for x-account-id: only add to required if it's required in the spec
                // The StackOneTool class will handle adding it from the accountId parameter if available
                if (resolvedParam.required && !(paramName === 'x-account-id')) {
                  requiredParams.push(paramName);
                }
              } catch (_paramError) {
                // Continue with other parameters even if one fails
              }
            }

            // Add request body properties if present
            if (requestBodySchema && typeof requestBodySchema === 'object') {
              const bodyProps = requestBodySchema.properties || {};

              // Extract required fields from request body
              if ('required' in requestBodySchema && Array.isArray(requestBodySchema.required)) {
                requiredParams = [...requiredParams, ...requestBodySchema.required];
              }

              for (const [propName, propSchema] of Object.entries(bodyProps)) {
                try {
                  // Create a deep copy of the propSchema to avoid shared state
                  properties[propName] = JSON.parse(JSON.stringify(propSchema)) as JsonSchema;
                  parameterLocations[propName] = this.getParameterLocation(
                    propSchema as Record<string, unknown>
                  );
                } catch (_propError) {
                  // Continue with other properties even if one fails
                }
              }
            }

            // Create tool definition with deep copies to prevent shared state
            tools[name] = {
              description: operation.summary || '',
              parameters: {
                type: 'object',
                properties: JSON.parse(JSON.stringify(properties)),
                required: requiredParams.length > 0 ? requiredParams : undefined,
              },
              execute: {
                method: method.toUpperCase(),
                url: `${this._baseUrl}${path}`,
                bodyType: (bodyType as 'json' | 'multipart-form') || 'json',
                params: Object.entries(parameterLocations).map(([name, location]) => {
                  return {
                    name,
                    location,
                    type: (properties[name]?.type as JsonSchema['type']) || 'string',
                  };
                }),
              },
            };
          } catch (operationError) {
            console.error(`Error processing operation ${name}: ${operationError}`);
            // Continue with other operations even if one fails
          }
        }
      }
    } catch (error) {
      console.error('Error parsing OpenAPI spec:', error);
    }

    return tools;
  }

  /**
   * Extract operations from a path item
   */
  public extractOperations(
    pathItem: OpenAPIV3.PathItemObject
  ): [string, OpenAPIV3.OperationObject][] {
    const operations: [string, OpenAPIV3.OperationObject][] = [];
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
      const operation = pathItem[method];
      if (operation) {
        operations.push([method, operation]);
      }
    }

    return operations;
  }

  /**
   * Resolve a parameter reference
   */
  public resolveParameter(
    param: OpenAPIV3.ParameterObject | OpenAPIV3.ReferenceObject
  ): OpenAPIV3.ParameterObject | null {
    try {
      if ('$ref' in param) {
        const ref = param.$ref;
        const parts = ref.split('/').slice(1); // Skip the '#'
        let current: unknown = this._spec;
        for (const part of parts) {
          if (typeof current === 'object' && current !== null) {
            current = (current as Record<string, unknown>)[part];
          } else {
            return null;
          }
        }
        return current as OpenAPIV3.ParameterObject;
      }
      return param;
    } catch (_error) {
      return null;
    }
  }

  /**
   * Get the base URL
   */
  public get baseUrl(): string {
    return this._baseUrl;
  }
}
