/**
 * Common type definitions for the StackOne SDK
 */

import type { Tool, ToolSet } from 'ai';
import type { JsonObject, JsonValue } from 'type-fest';

export type { JsonObject, JsonValue };

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
 * How the MCP endpoint lists tools.
 *
 * `'individual'` (the server default) lists one tool per action — hundreds per account.
 * `'search_execute'` lists two meta tools per connector instead: a `*_search_actions` that ranks
 * actions for a natural-language query and an `*_execute_action` that runs one by id. The
 * catalog stays small however many accounts are linked, which is what keeps it inside a model's
 * context.
 */
export type ToolMode = 'individual' | 'search_execute';

/**
 * Executes over the StackOne actions RPC endpoint (`POST /actions/rpc`). Every per-action tool
 * listed in `individual` mode is one of these.
 */
export interface RpcExecuteConfig {
	kind: 'rpc';
	method: 'POST';
	url: string;
	payloadKeys: {
		action: string;
		body?: string;
		headers?: string;
		path?: string;
		query?: string;
	};
}

/**
 * Executes over MCP `tools/call` on the endpoint that listed it. The search/execute meta tools
 * have no action behind them on `/actions/rpc`; `stackone_submit_feedback` is not a connector
 * action either, so the SDK calls it here even though the server also accepts it over RPC.
 */
export interface McpExecuteConfig {
	kind: 'mcp';
	url: string;
	toolName: string;
}

/**
 * A tool whose `execute` is supplied by the caller rather than by the SDK.
 */
interface LocalExecuteConfig {
	kind: 'local';
	identifier?: string;
	description?: string;
}

/**
 * Discriminated union lets call sites branch on execution style without relying on nullable fields.
 */
export type ExecuteConfig = RpcExecuteConfig | McpExecuteConfig | LocalExecuteConfig;

/**
 * Options for executing a tool
 */
export interface ExecuteOptions {
	/**
	 * If true, returns the request the tool would send instead of sending it. Useful for
	 * checking how arguments are routed into the RPC envelope.
	 */
	dryRun?: boolean;
}

/**
 * Execution metadata that can be surfaced to AI SDK tools.
 */
export interface ToolExecution {
	/**
	 * How the tool is executed.
	 */
	config: ExecuteConfig;
}

/**
 * Schema definition for tool parameters: the served `inputSchema`, verbatim.
 *
 * Every root keyword the server sends (`$schema`, `$defs`, `title`, `additionalProperties`,
 * `oneOf`, …) is kept, so {@link BaseTool.toJsonSchema} can hand a model exactly what was served.
 */
export interface ToolParameters extends Record<string, unknown> {
	type: string;
	properties: JsonSchemaProperties;
	required?: string[];
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

/**
 * An account linked to the API key, as `GET /accounts` returns it. Only accounts whose `status`
 * is `'active'` can serve tools.
 */
export type StackOneAccount = JsonObject & {
	id: string;
	provider?: string;
	status?: string;
};

/**
 * One action a `search()` found. Carries at least `action_id` and `description`, plus whatever
 * else the server returns for it (`similarity_score`, `input_schema`, `example_request`, …).
 */
export type SearchResult = JsonObject & {
	action_id: string;
	/**
	 * The `session_id` of the search that produced this hit, when the server issued one. Pass it
	 * to `execute()` and `submitFeedback()` to link those calls to this search.
	 */
	session_id?: string;
};

/** The verdict `submitFeedback()` records. */
export type FeedbackRating = 'positive' | 'negative' | 'neutral';

/** Who produced the feedback. */
export type FeedbackSource = 'model' | 'user' | 'system';

/** What the feedback is about. */
export type FeedbackCategory = 'search' | 'execute' | 'defender' | 'connection' | 'general';
