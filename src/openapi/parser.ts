import type { JSONSchema7 as JsonSchema } from 'json-schema';
import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import { type HttpExecuteConfig, ParameterLocation, type ToolDefinition } from '../types';
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
  private _removedParams: string[];

  /**
   * Create a new OpenAPIParser
   * @param spec The OpenAPI specification object
   * @param customBaseUrl Optional custom base URL to use for all operations
   * @param removedParams Optional array of parameter names to remove from all tools
   */
  constructor(spec: OpenAPIDocument, customBaseUrl?: string, removedParams?: string[]) {
    this._spec = spec;
    this._baseUrl = customBaseUrl || this.determineBaseUrl();
    // Default to removing source_value if no removedParams provided
    this._removedParams = removedParams || [];
  }

  /**
   * Helper method to check if a parameter should be removed
   */
  private isRemovedParam(paramName: string): boolean {
    return this._removedParams.includes(paramName);
  }

  /**
   * Helper method to check if a schema is deprecated
   */
  private isDeprecated(schema: unknown): boolean {
    return (
      typeof schema === 'object' &&
      schema !== null &&
      'deprecated' in schema &&
      (schema as { deprecated?: boolean }).deprecated === true
    );
  }

  /**
   * Helper method to check if a value is a non-null object
   */
  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
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

  private normalizeBodyType(bodyType: string | null): HttpExecuteConfig['bodyType'] {
    // Map OpenAPI content types into the narrower set supported by ExecuteConfig.
    if (!bodyType) {
      return 'json';
    }

    if (bodyType === 'form-data' || bodyType === 'multipart-form') {
      return 'multipart-form';
    }

    if (bodyType === 'form' || bodyType === 'application/x-www-form-urlencoded') {
      return 'form';
    }

    return 'json';
  }

  /**
   * Create a parser from a JSON string
   * @param specString OpenAPI specification as a JSON string
   * @param customBaseUrl Optional custom base URL to use for all tools
   * @param removedParams Optional array of parameter names to remove from all tools
   * @returns A new OpenAPIParser instance
   */
  public static fromString(
    specString: string,
    customBaseUrl?: string,
    removedParams?: string[]
  ): OpenAPIParser {
    const spec = JSON.parse(specString) as OpenAPIDocument;
    return new OpenAPIParser(spec, customBaseUrl, removedParams);
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
      if (this.isObject(current)) {
        current = current[part];
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
   * This also filters out deprecated properties and properties in removedParams
   */
  public resolveSchema(
    schema: SchemaObject | unknown,
    visited: Set<string> = new Set()
  ): JsonSchema {
    // Handle primitive types (string, number, etc)
    if (!this.isObject(schema)) {
      return schema as JsonSchema;
    }

    // Skip if schema is deprecated
    if (this.isDeprecated(schema)) {
      return {} as JsonSchema;
    }

    if (Array.isArray(schema)) {
      return schema.map((item) =>
        this.resolveSchema(item, new Set(visited))
      ) as unknown as JsonSchema;
    }

    // Handle direct reference
    if ('$ref' in schema && typeof schema.$ref === 'string') {
      const resolved = this.resolveSchemaRef(schema.$ref, visited);
      if (!this.isObject(resolved)) {
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
    if ('allOf' in schema) {
      const schemaObj = schema as OpenAPIV3.SchemaObject;
      // Create a new object without the allOf property to avoid type issues
      const { allOf, ...restSchema } = schemaObj;
      const mergedSchema: JsonSchema = restSchema as JsonSchema;

      // Merge all schemas in allOf array
      if (Array.isArray(allOf)) {
        for (const subSchema of allOf) {
          const resolved = this.resolveSchema(subSchema, new Set(visited));
          if (!this.isObject(resolved)) {
            continue;
          }

          // Merge properties
          if ('properties' in resolved) {
            if (!mergedSchema.properties) {
              mergedSchema.properties = {};
            }
            // Ensure both are objects before spreading
            const resolvedProps = resolved.properties || {};
            mergedSchema.properties = {
              ...(mergedSchema.properties || {}),
              ...resolvedProps,
            };
          }

          // Merge required fields
          if ('required' in resolved && Array.isArray(resolved.required)) {
            // Just use a simple array concat approach without spreading
            if (mergedSchema.required) {
              for (const req of resolved.required) {
                if (!mergedSchema.required.includes(req)) {
                  mergedSchema.required.push(req);
                }
              }
            } else {
              mergedSchema.required = resolved.required.slice();
            }
          }

          // Merge other fields
          for (const [key, value] of Object.entries(resolved)) {
            if (key !== 'properties' && key !== 'required' && !(key in mergedSchema)) {
              (mergedSchema as Record<string, unknown>)[key] = value;
            }
          }
        }
      }

      return mergedSchema;
    }

    const schemaObj = schema as OpenAPIV3.SchemaObject;
    const resolved: Record<string, unknown> = {};

    // Handle properties
    if ('properties' in schemaObj && typeof schemaObj.properties === 'object') {
      resolved.properties = {};
      const requiredProps: string[] = [];

      for (const [propName, propSchema] of Object.entries(schemaObj.properties)) {
        // Skip null properties
        if (propSchema === null) continue;

        // Skip properties that should be removed or are deprecated
        if (this.isRemovedParam(propName) || this.isDeprecated(propSchema)) continue;

        // A property is required if:
        // 1. It's in the parent's required array AND
        // 2. It's not marked as nullable in OpenAPI
        const isNullable =
          this.isObject(propSchema) && 'nullable' in propSchema && propSchema.nullable === true;
        const isRequired =
          Array.isArray(schemaObj.required) &&
          schemaObj.required.includes(propName) &&
          !this.isRemovedParam(propName);

        if (isRequired && !isNullable) {
          requiredProps.push(propName);
        }

        // Process the property schema
        (resolved.properties as Record<string, unknown>)[propName] = this.resolveSchema(
          propSchema,
          new Set(visited)
        );
      }

      // Only add required array if there are required properties
      if (requiredProps.length > 0) {
        resolved.required = requiredProps;
      }
    } else if ('required' in schemaObj && Array.isArray(schemaObj.required)) {
      // Filter the required array to remove any properties in removedParams
      const filteredRequired = schemaObj.required.filter((prop) => !this.isRemovedParam(prop));
      if (filteredRequired.length > 0) {
        resolved.required = filteredRequired;
      }
    }

    // Process remaining fields
    for (const [key, value] of Object.entries(schema)) {
      // Skip already handled or special properties
      if (
        key === 'properties' ||
        key === 'required' ||
        key === 'nullable' ||
        key === 'deprecated' ||
        key.startsWith('x-')
      ) {
        continue;
      }

      if (this.isObject(value)) {
        if (Array.isArray(value)) {
          resolved[key] = value.map((item) => this.resolveSchema(item, new Set(visited)));
        } else {
          resolved[key] = this.resolveSchema(value, new Set(visited));
        }
      } else {
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
   * Helper method to check if an item should be skipped (removed or deprecated)
   */
  private shouldSkipItem(name: string, item: unknown): boolean {
    return this.isRemovedParam(name) || this.isDeprecated(item);
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
    if (this.isObject(propSchema) && 'in' in propSchema) {
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
   * Filter out removed parameters from both properties and required arrays
   */
  private filterRemovedParams(
    properties: Record<string, JsonSchema>,
    required?: string[]
  ): [Record<string, JsonSchema>, string[] | undefined] {
    // Final cleanup of properties
    const filteredProperties = { ...properties };
    for (const param of this._removedParams) {
      delete filteredProperties[param];
    }

    // Final cleanup of required fields
    const filteredRequired = required?.filter((param) => !this.isRemovedParam(param));

    return [
      filteredProperties,
      filteredRequired && filteredRequired.length > 0 ? filteredRequired : undefined,
    ];
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

                // Skip parameters that should be removed or are deprecated
                if (this.shouldSkipItem(paramName, resolvedParam)) {
                  continue;
                }

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
                  // Skip items that should be removed or are deprecated
                  if (this.shouldSkipItem(propName, propSchema)) {
                    continue;
                  }

                  // Create a deep copy of the propSchema to avoid shared state
                  properties[propName] = this.resolveSchema(propSchema);
                  parameterLocations[propName] = this.getParameterLocation(
                    propSchema as Record<string, unknown>
                  );
                } catch (_propError) {
                  // Continue with other properties even if one fails
                }
              }
            }

            // Filter out removed parameters from properties and required arrays
            const [filteredProperties, filteredRequired] = this.filterRemovedParams(
              properties,
              requiredParams
            );

            // Create tool definition with deep copies to prevent shared state
            const executeConfig = {
              kind: 'http',
              method: method.toUpperCase(),
              url: `${this._baseUrl}${path}`,
              bodyType: this.normalizeBodyType(bodyType),
              params: Object.entries(parameterLocations)
                .filter(([name]) => !this.isRemovedParam(name))
                .map(([name, location]) => {
                  return {
                    name,
                    location,
                    type: (filteredProperties[name]?.type as JsonSchema['type']) || 'string',
                  };
                }),
            } satisfies HttpExecuteConfig;

            tools[name] = {
              description: operation.summary || '',
              parameters: {
                type: 'object',
                properties: filteredProperties,
                required: filteredRequired,
              },
              execute: executeConfig,
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
          if (this.isObject(current)) {
            current = current[part];
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
