/**
 * Common type definitions for the StackOne SDK
 */

import type { Tool } from 'ai';
import type { ToolSet } from 'ai';
import type { JsonObject, JsonValue, ValueOf } from 'type-fest';

export type { JsonObject, JsonValue };

/**
 * HTTP headers type
 */
type Headers = Record<string, string>;

/**
 * JSON Schema type for defining tool input/output schemas as raw JSON Schema objects.
 * This allows tools to be defined without Zod when you have JSON Schema definitions available.
 *
 * @see https://github.com/TanStack/ai/blob/049eb8acd83e6d566c6040c0c4cb53dbe222d46a/packages/typescript/ai/src/types.ts#L5C1-L49C1
 */
export interface JSONSchema {
	type?: string | Array<string>;
	properties?: Record<string, JSONSchema>;
	items?: JSONSchema | Array<JSONSchema>;
	required?: Array<string>;
	enum?: Array<JsonValue>;
	const?: JsonValue;
	description?: string;
	default?: JsonValue;
	$ref?: string;
	$defs?: Record<string, JSONSchema>;
	definitions?: Record<string, JSONSchema>;
	allOf?: Array<JSONSchema>;
	anyOf?: Array<JSONSchema>;
	oneOf?: Array<JSONSchema>;
	not?: JSONSchema;
	if?: JSONSchema;
	then?: JSONSchema;
	else?: JSONSchema;
	minimum?: number;
	maximum?: number;
	exclusiveMinimum?: number;
	exclusiveMaximum?: number;
	minLength?: number;
	maxLength?: number;
	pattern?: string;
	format?: string;
	minItems?: number;
	maxItems?: number;
	uniqueItems?: boolean;
	additionalProperties?: boolean | JSONSchema;
	additionalItems?: boolean | JSONSchema;
	patternProperties?: Record<string, JSONSchema>;
	propertyNames?: JSONSchema;
	minProperties?: number;
	maxProperties?: number;
	title?: string;
	examples?: Array<JsonValue>;
	[key: string]:
		| JsonValue
		| JSONSchema
		| Array<JSONSchema>
		| Record<string, JSONSchema>
		| undefined; // Allow additional properties for extensibility
}

/**
 * JSON Schema properties type
 */
export type JsonSchemaProperties = Record<string, JSONSchema>;

/**
 * JSON Schema type union
 */
type JsonSchemaType = JSONSchema['type'];

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
interface HttpExecuteParameter {
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
 * Extends the base Tool type from the 'ai' package.
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
 * Uses the ToolSet type from AI SDK to ensure full compatibility with
 * generateText, streamText, and other AI SDK functions.
 *
 * NOTE: We extend ToolSet with our custom AISDKToolDefinition to ensure
 * both AI SDK compatibility and access to StackOne-specific properties
 * like `execution` metadata.
 */
export type AISDKToolResult<T extends string = string> = ToolSet & {
	[K in T]: AISDKToolDefinition;
};

/**
 * Options for toClaudeAgentSdk() method
 */
export interface ClaudeAgentSdkOptions {
	/**
	 * Name of the MCP server. Defaults to 'stackone-tools'.
	 */
	serverName?: string;
	/**
	 * Version of the MCP server. Defaults to '1.0.0'.
	 */
	serverVersion?: string;
}
