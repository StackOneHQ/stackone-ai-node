import { type JSONSchema7 as AISDKJSONSchema, jsonSchema } from 'ai';
import type { Tool as AnthropicTool } from '@anthropic-ai/sdk/resources';
import type { McpSdkServerConfigWithInstance } from '@anthropic-ai/claude-agent-sdk';
import type { ChatCompletionFunctionTool } from 'openai/resources/chat/completions';
import type { FunctionTool as OpenAIResponsesFunctionTool } from 'openai/resources/responses/responses';
import type { OverrideProperties } from 'type-fest';
import { peerDependencies } from '../package.json';
import { RequestBuilder } from './requestBuilder';
import type {
	AISDKToolDefinition,
	AISDKToolResult,
	ClaudeAgentSdkOptions,
	ExecuteConfig,
	ExecuteOptions,
	HttpExecuteConfig,
	JsonObject,
	JSONSchema,
	LocalExecuteConfig,
	RpcExecuteConfig,
	ToolExecution,
	ToolParameters,
} from './types';

import { StackOneError } from './utils/error-stackone';
import { tryImport } from './utils/try-import';

/**
 * JSON Schema with type narrowed to 'object'
 * Used for tool parameter schemas which are always objects
 */
type ObjectJSONSchema = OverrideProperties<JSONSchema, { type: 'object' }>;

/**
 * Base class for all tools. Provides common functionality for executing API calls
 * and converting to various formats (OpenAI, AI SDK)
 */
export class BaseTool {
	name: string;
	description: string;
	parameters: ToolParameters;
	executeConfig: ExecuteConfig;
	protected requestBuilder?: RequestBuilder;
	#exposeExecutionMetadata = true;
	#headers: Record<string, string>;

	private createExecutionMetadata(): ToolExecution {
		const config = (() => {
			switch (this.executeConfig.kind) {
				case 'http':
					return {
						kind: 'http',
						method: this.executeConfig.method,
						url: this.executeConfig.url,
						bodyType: this.executeConfig.bodyType,
						params: this.executeConfig.params.map((param) => ({
							...param,
						})),
					} satisfies HttpExecuteConfig;
				case 'rpc':
					return {
						kind: 'rpc',
						method: this.executeConfig.method,
						url: this.executeConfig.url,
						payloadKeys: { ...this.executeConfig.payloadKeys },
					} satisfies RpcExecuteConfig;
				case 'local':
					return {
						kind: 'local',
						identifier: this.executeConfig.identifier,
						description: this.executeConfig.description,
					} satisfies LocalExecuteConfig;
				default:
					this.executeConfig satisfies never;
					throw new StackOneError('Unsupported executeConfig kind');
			}
		})();

		return {
			config,
			headers: this.getHeaders(),
		};
	}

	constructor(
		name: string,
		description: string,
		parameters: ToolParameters,
		executeConfig: ExecuteConfig,
		headers?: Record<string, string>,
	) {
		this.name = name;
		this.description = description;
		this.parameters = parameters;
		this.executeConfig = executeConfig;
		this.#headers = { ...headers };
		if (executeConfig.kind === 'http') {
			this.requestBuilder = new RequestBuilder(executeConfig, this.#headers);
		}
	}

	/**
	 * Set headers for this tool
	 */
	setHeaders(headers: Record<string, string>): BaseTool {
		this.#headers = { ...this.#headers, ...headers };
		if (this.requestBuilder) {
			this.requestBuilder.setHeaders(headers);
		}
		return this;
	}

	/**
	 * Get the current headers
	 */
	getHeaders(): Record<string, string> {
		if (this.requestBuilder) {
			const currentHeaders = this.requestBuilder.getHeaders();
			this.#headers = { ...currentHeaders };
			return currentHeaders;
		}
		return { ...this.#headers };
	}

	/**
	 * Extract connector/provider prefix from the tool name.
	 *
	 * Tool names follow the format `{connector}_{action}_{entity}`,
	 * e.g. `"bamboohr_list_employees"` → `"bamboohr"`.
	 */
	get connector(): string {
		return this.name.split('_')[0]?.toLowerCase() ?? '';
	}

	/**
	 * Control whether execution metadata should be exposed in AI SDK conversions.
	 */
	setExposeExecutionMetadata(expose: boolean): this {
		this.#exposeExecutionMetadata = expose;
		return this;
	}

	/**
	 * Execute the tool with the provided parameters
	 */
	async execute(inputParams?: JsonObject | string, options?: ExecuteOptions): Promise<JsonObject> {
		try {
			if (!this.requestBuilder || this.executeConfig.kind !== 'http') {
				// Non-HTTP tools provide their own execute override (e.g. RPC, local meta tools).
				throw new StackOneError(
					'BaseTool.execute is only available for HTTP-backed tools. Provide a custom execute implementation for non-HTTP tools.',
				);
			}
			// Validate params is either undefined, string, or object
			if (
				inputParams !== undefined &&
				typeof inputParams !== 'string' &&
				typeof inputParams !== 'object'
			) {
				throw new StackOneError(
					`Invalid parameters type. Expected object or string, got ${typeof inputParams}. Parameters: ${JSON.stringify(
						inputParams,
					)}`,
				);
			}

			// Convert string params to object
			const params = typeof inputParams === 'string' ? JSON.parse(inputParams) : inputParams || {};

			// Execute the request directly with parameters
			return await this.requestBuilder.execute(params, options);
		} catch (error) {
			if (error instanceof StackOneError) {
				throw error;
			}
			throw new StackOneError(
				`Error executing tool: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * Convert the tool parameters to a pure JSON Schema format
	 * This is framework-agnostic and can be used with any LLM that accepts JSON Schema
	 */
	toJsonSchema(): ObjectJSONSchema {
		return {
			type: 'object',
			properties: this.parameters.properties,
			required: this.parameters.required,
		};
	}

	/**
	 * Convert the tool to OpenAI Chat Completions API format
	 */
	toOpenAI(): ChatCompletionFunctionTool {
		return {
			type: 'function',
			function: {
				name: this.name,
				description: this.description,
				parameters: this.toJsonSchema(),
			},
		};
	}

	/**
	 * Convert the tool to Anthropic format
	 * @see https://docs.anthropic.com/en/docs/build-with-claude/tool-use
	 */
	toAnthropic(): AnthropicTool {
		return {
			name: this.name,
			description: this.description,
			input_schema: this.toJsonSchema(),
		};
	}

	/**
	 * Convert the tool to OpenAI Responses API format
	 * @see https://platform.openai.com/docs/api-reference/responses
	 */
	toOpenAIResponses(options: { strict?: boolean } = {}): OpenAIResponsesFunctionTool {
		const { strict = true } = options;
		return {
			type: 'function',
			name: this.name,
			description: this.description,
			strict,
			parameters: {
				...this.toJsonSchema(),
				...(strict ? { additionalProperties: false } : {}),
			},
		};
	}

	/**
	 * Convert the tool to Claude Agent SDK format.
	 * Returns a tool definition compatible with the Claude Agent SDK's tool() function.
	 *
	 * @see https://docs.anthropic.com/en/docs/agents-and-tools/claude-agent-sdk
	 */
	async toClaudeAgentSdkTool(): Promise<{
		name: string;
		description: string;
		inputSchema: Record<string, unknown>;
		handler: (
			args: Record<string, unknown>,
		) => Promise<{ content: Array<{ type: 'text'; text: string }> }>;
	}> {
		const inputSchema = jsonSchema(this.toJsonSchema());
		const execute = this.execute.bind(this);

		return {
			name: this.name,
			description: this.description,
			inputSchema,
			handler: async (args: Record<string, unknown>) => {
				const result = await execute(args as JsonObject);
				return {
					content: [{ type: 'text' as const, text: JSON.stringify(result) }],
				};
			},
		};
	}

	/**
	 * Convert the tool to AI SDK format
	 */
	async toAISDK(
		options: { executable?: boolean; execution?: ToolExecution | false } = {
			executable: true,
		},
	): Promise<AISDKToolResult> {
		const schema = {
			...this.toJsonSchema(),
			additionalProperties: false,
		} satisfies AISDKJSONSchema;

		/** AI SDK is optional dependency, import only when needed */
		const ai = await tryImport<typeof import('ai')>(
			'ai',
			`npm install ai (requires ${peerDependencies.ai})`,
		);
		const schemaObject = ai.jsonSchema(schema);

		const executionOption =
			options.execution !== undefined
				? options.execution
				: this.#exposeExecutionMetadata
					? this.createExecutionMetadata()
					: false;

		const toolDefinition = {
			inputSchema: schemaObject,
			description: this.description,
			execution: executionOption !== false ? executionOption : undefined,
			execute:
				(options.executable ?? true)
					? async (args: Record<string, unknown>) => {
							try {
								return await this.execute(args as JsonObject);
							} catch (error) {
								return `Error executing tool: ${
									error instanceof Error ? error.message : String(error)
								}`;
							}
						}
					: undefined,
		} satisfies AISDKToolDefinition;

		return {
			[this.name]: toolDefinition,
		} satisfies AISDKToolResult;
	}
}

/**
 * StackOne-specific tool class with additional functionality
 */
export class StackOneTool extends BaseTool {
	/**
	 * Get the current account ID
	 */
	getAccountId(): string | undefined {
		return this.getHeaders()['x-account-id'];
	}

	/**
	 * Set the account ID for this tool
	 */
	setAccountId(accountId: string): StackOneTool {
		this.setHeaders({ 'x-account-id': accountId });
		return this;
	}
}

/**
 * Collection of tools with utility methods
 */
export class Tools implements Iterable<BaseTool> {
	private tools: BaseTool[];

	constructor(tools: BaseTool[]) {
		this.tools = tools;
	}

	/**
	 * Get the number of tools in the collection
	 */
	get length(): number {
		return this.tools.length;
	}

	/**
	 * Get a tool by name
	 */
	getTool(name: string): BaseTool | undefined {
		return this.tools.find((tool) => tool.name === name);
	}

	/**
	 * Get a StackOne tool by name
	 */
	getStackOneTool(name: string): StackOneTool {
		const tool = this.getTool(name);
		if (tool instanceof StackOneTool) {
			return tool;
		}
		throw new StackOneError(`Tool ${name} is not a StackOne tool`);
	}

	/**
	 * Check if a tool is a StackOne tool
	 */
	isStackOneTool(tool: BaseTool): tool is StackOneTool {
		return tool instanceof StackOneTool;
	}

	/**
	 * Get all StackOne tools in the collection
	 */
	getStackOneTools(): StackOneTool[] {
		return this.tools.filter((tool): tool is StackOneTool => tool instanceof StackOneTool);
	}

	/**
	 * Convert all tools to pure JSON Schema format
	 * Returns an array of objects with name, description, and schema
	 */
	toJsonSchema(): Array<{ name: string; description: string; parameters: JSONSchema }> {
		return this.tools.map((tool) => ({
			name: tool.name,
			description: tool.description,
			parameters: tool.toJsonSchema(),
		}));
	}

	/**
	 * Convert all tools to OpenAI Chat Completions API format
	 */
	toOpenAI(): ChatCompletionFunctionTool[] {
		return this.tools.map((tool) => tool.toOpenAI());
	}

	/**
	 * Convert all tools to Anthropic format
	 * @see https://docs.anthropic.com/en/docs/build-with-claude/tool-use
	 */
	toAnthropic(): AnthropicTool[] {
		return this.tools.map((tool) => tool.toAnthropic());
	}

	/**
	 * Convert all tools to OpenAI Responses API format
	 * @see https://platform.openai.com/docs/api-reference/responses
	 */
	toOpenAIResponses(options: { strict?: boolean } = {}): OpenAIResponsesFunctionTool[] {
		return this.tools.map((tool) => tool.toOpenAIResponses(options));
	}

	/**
	 * Convert all tools to AI SDK format
	 */
	async toAISDK(
		options: { executable?: boolean; execution?: ToolExecution | false } = {
			executable: true,
		},
	): Promise<AISDKToolResult> {
		const result: AISDKToolResult = {};
		for (const tool of this.tools) {
			Object.assign(result, await tool.toAISDK(options));
		}
		return result;
	}

	/**
	 * Convert all tools to Claude Agent SDK format.
	 * Returns an MCP server configuration that can be passed to the
	 * Claude Agent SDK query() function's mcpServers option.
	 *
	 * @example
	 * ```typescript
	 * const tools = await toolset.fetchTools();
	 * const mcpServer = await tools.toClaudeAgentSdk();
	 *
	 * const result = query({
	 *   prompt: 'Get employee info',
	 *   options: {
	 *     model: 'claude-sonnet-4-5-20250929',
	 *     mcpServers: {
	 *       'stackone-tools': mcpServer,
	 *     },
	 *   },
	 * });
	 * ```
	 *
	 * @see https://docs.anthropic.com/en/docs/agents-and-tools/claude-agent-sdk
	 */
	async toClaudeAgentSdk(
		options: ClaudeAgentSdkOptions = {},
	): Promise<McpSdkServerConfigWithInstance> {
		const { serverName = 'stackone-tools', serverVersion = '1.0.0' } = options;

		// Import the Claude Agent SDK dynamically
		const claudeAgentSdk = await tryImport<typeof import('@anthropic-ai/claude-agent-sdk')>(
			'@anthropic-ai/claude-agent-sdk',
			`npm install @anthropic-ai/claude-agent-sdk (requires ${peerDependencies['@anthropic-ai/claude-agent-sdk']})`,
		);

		// Convert all tools to Claude Agent SDK format
		// We use type assertions here because the Zod types from our dynamic import
		// don't perfectly match the Claude Agent SDK's expected types at compile time
		const sdkTools = await Promise.all(
			this.tools.map(async (baseTool) => {
				const toolDef = await baseTool.toClaudeAgentSdkTool();
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Dynamic Zod schema types
				return claudeAgentSdk.tool(
					toolDef.name,
					toolDef.description,
					toolDef.inputSchema as any,
					toolDef.handler as any,
				);
			}),
		);

		// Create and return the MCP server
		return claudeAgentSdk.createSdkMcpServer({
			name: serverName,
			version: serverVersion,
			tools: sdkTools,
		});
	}

	/**
	 * Filter tools by a predicate function
	 */
	filter(predicate: (tool: BaseTool) => boolean): Tools {
		return new Tools(this.tools.filter(predicate));
	}

	/**
	 * Get unique connector names from all tools.
	 *
	 * Extracts the connector/provider prefix from each tool name
	 * (the first segment before `_`).
	 *
	 * @returns Set of connector names (lowercase)
	 *
	 * @example
	 * ```typescript
	 * const tools = await toolset.fetchTools();
	 * const connectors = tools.getConnectors();
	 * // Set { 'bamboohr', 'hibob', 'slack', ... }
	 * ```
	 */
	getConnectors(): Set<string> {
		const connectors = new Set<string>();
		for (const tool of this.tools) {
			if (tool.connector) {
				connectors.add(tool.connector);
			}
		}
		return connectors;
	}

	/**
	 * Iterator implementation
	 */
	[Symbol.iterator](): Iterator<BaseTool> {
		let index = 0;
		const tools = this.tools;

		return {
			next(): IteratorResult<BaseTool> {
				if (index < tools.length) {
					return { value: tools[index++], done: false };
				}
				return { value: undefined as unknown as BaseTool, done: true };
			},
		};
	}

	/**
	 * Convert to array
	 */
	toArray(): BaseTool[] {
		return [...this.tools];
	}

	/**
	 * Map tools to a new array
	 */
	map<T>(mapper: (tool: BaseTool) => T): T[] {
		return this.tools.map(mapper);
	}

	/**
	 * Execute a function for each tool
	 */
	forEach(callback: (tool: BaseTool) => void): void {
		this.tools.forEach(callback);
	}
}
