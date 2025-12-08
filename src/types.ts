/**
 * Common type definitions for the StackOne SDK
 */

import type { Tool } from '@ai-sdk/provider-utils';
import type { JSONSchema7, JSONSchema7Definition } from 'json-schema';
import type { ValueOf } from 'type-fest';

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
export const ParameterLocation = {
  HEADER: 'header',
  QUERY: 'query',
  PATH: 'path',
  BODY: 'body',
} as const satisfies Record<string, string>;

export type ParameterLocation = ValueOf<typeof ParameterLocation>;

/**
 * Configuration for executing a tool against an API endpoint
 */
export interface HttpExecuteParameter {
  name: string;
  location: ParameterLocation;
  type: JsonSchemaType;
  derivedFrom?: string; // this is the name of the param that this one is derived from.
}

export type HttpBodyType = 'json' | 'multipart-form' | 'form';

export interface HttpExecuteConfig {
  kind: 'http';
  method: string;
  url: string;
  bodyType: HttpBodyType;
  params: HttpExecuteParameter[]; // full list of params used to execute. Comes straight from the OpenAPI spec.
}

export interface RpcExecuteConfig {
  kind: 'rpc';
  method: string;
  url: string;
  payloadKeys: {
    action: string;
    body?: string;
    headers?: string;
    path?: string;
    query?: string;
  };
}

export interface LocalExecuteConfig {
  kind: 'local';
  identifier?: string;
  description?: string;
}

/**
 * Discriminated union lets call sites branch on execution style without relying on nullable fields.
 */
export type ExecuteConfig = HttpExecuteConfig | RpcExecuteConfig | LocalExecuteConfig;

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
}

/**
 * Execution metadata that can be surfaced to AI SDK tools.
 */
export interface ToolExecution {
  /**
   * The raw execution configuration generated from the OpenAPI specification.
   */
  config: ExecuteConfig;
  /**
   * The headers that will be sent when executing the tool.
   */
  headers: Headers;
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

/**
 * Extended AI SDK tool definition with StackOne-specific execution metadata.
 * Extends the base Tool type from @ai-sdk/provider-utils.
 *
 * NOTE: We avoid defining our own types as much as possible and use existing
 * types from dependencies. This type only extends the AI SDK Tool type with
 * StackOne-specific metadata that doesn't exist in the original type.
 */
export type AISDKToolDefinition = Tool & {
  /**
   * StackOne-specific execution metadata for debugging and introspection.
   */
  execution?: ToolExecution;
};

/**
 * Result type for toAISDK() method.
 * Maps tool names to their AI SDK tool definitions.
 *
 * NOTE: We avoid defining our own types as much as possible and use existing
 * types from dependencies. This is a simple mapped type over AISDKToolDefinition.
 */
export type AISDKToolResult<T extends string = string> = Record<T, AISDKToolDefinition>;
