/**
 * Common type definitions for the StackOne SDK
 */

import type { JSONSchema7, JSONSchema7Definition } from 'json-schema';

/**
 * Generic dictionary type for JSON-compatible objects
 */
export type JsonDict = Record<string, unknown>;

/**
 * HTTP headers type
 */
export type Headers = Record<string, string>;

/**
 * JSON Schema properties type
 */
export type JsonSchemaProperties = Record<string, JSONSchema7Definition>;

/**
 * JSON Schema type
 */
export type JsonSchemaType = JSONSchema7['type'];

/**
 * Type definition for a derivation function
 * Takes a source value and returns a derived value
 */
export type TransformFunction = (sourceValue: unknown) => unknown;

/**
 * Type definition for a map of derivation functions
 * Keys are transformed parameter names, values are functions to derive that parameter
 */
export type TransformFunctions = Record<string, TransformFunction>;

/**
 * Configuration for parameter transformations
 * The key in the derivation configs map is the source parameter name
 */
export type ParameterTransformer = {
  transforms: TransformFunctions;
};

/**
 * Type definition for a map of derivation configurations
 * Keys are source parameter names, values are derivation functions
 */
export type ParameterTransformerMap = Map<string, ParameterTransformer>;

/**
 * Valid locations for parameters in requests
 */
export enum ParameterLocation {
  HEADER = 'header',
  QUERY = 'query',
  PATH = 'path',
  BODY = 'body',
}

/**
 * Configuration for executing a tool against an API endpoint
 */
export interface ExecuteConfig {
  method: string;
  url: string;
  bodyType: 'json' | 'multipart-form' | 'form';
  params: {
    name: string;
    location: ParameterLocation;
    type: JsonSchemaType;
    derivedFrom?: string; // this is the name of the param that this one is derived from.
  }[]; // this params are the full list of params used to execute. This should come straight from the OpenAPI spec.
}

/**
 * Options for executing a tool
 */
export interface ExecuteOptions {
  /**
   * If true, returns the request details instead of making the actual API call
   * Useful for debugging and testing transformed parameters
   */
  dryRun?: boolean;
}

/**
 * Schema definition for tool parameters
 */
export interface ToolParameters {
  type: string;
  properties: JsonSchemaProperties; // these are the params we will expose to the user/agent in the tool. These might be higher level params.
  required?: string[]; // list of required parameter names
}

/**
 * Complete definition of a tool including its schema and execution config
 */
export interface ToolDefinition {
  description: string;
  parameters: ToolParameters;
  execute: ExecuteConfig;
}
