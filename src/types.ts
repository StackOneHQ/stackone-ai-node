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
 * EXPERIMENTAL: Function to override the tool schema at creation time
 * Takes the original tool parameters and returns a new schema
 * @param originalSchema - The original tool parameters schema from OpenAPI
 * @returns New schema definition for the tool
 */
export type Experimental_SchemaOverride = (originalSchema: ToolParameters) => ToolParameters;

/**
 * EXPERIMENTAL: Function to preprocess parameters before tool execution
 * Transforms parameters from override schema format back to original API format
 * @param params - The input parameters in override schema format
 * @returns Parameters in original API format
 */
export type Experimental_PreExecuteFunction = (params: JsonDict) => Promise<JsonDict> | JsonDict;

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
 * EXPERIMENTAL: Options for creating tools with schema overrides and preExecute functions
 */
export interface Experimental_ToolCreationOptions {
  /**
   * EXPERIMENTAL: Function to override the tool schema at creation time
   * Takes the original schema and returns a new schema for the tool
   */
  experimental_schemaOverride?: Experimental_SchemaOverride;

  /**
   * EXPERIMENTAL: Function to preprocess parameters before execution
   * Transforms parameters from override schema format back to original API format
   */
  experimental_preExecute?: Experimental_PreExecuteFunction;
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

  /**
   * EXPERIMENTAL: Function to preprocess parameters before execution
   * Allows for document fetching, parameter override, etc.
   * @deprecated Use experimental_preExecute in tool creation options instead
   */
  experimental_PreExecute?: Experimental_PreExecuteFunction;
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
