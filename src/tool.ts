import type { JSONSchema7 as AISDKJSONSchema } from 'ai';
import type { Tool as AnthropicTool } from '@anthropic-ai/sdk/resources';
import type { McpSdkServerConfigWithInstance } from '@anthropic-ai/claude-agent-sdk';
import type {
	ChatCompletionFunctionTool,
	ChatCompletionMessageToolCall,
	ChatCompletionToolMessageParam,
} from 'openai/resources/chat/completions';
import type { FunctionTool as OpenAIResponsesFunctionTool } from 'openai/resources/responses/responses';
import type { OverrideProperties } from 'type-fest';
import { peerDependencies } from '../package.json';
import { SUBMIT_FEEDBACK_TOOL_NAME } from './consts';
import {
	type DeclaredHeaders,
	buildRequestHeaders,
	declaredHeaders,
	sanitiseHeaderArguments,
} from './headers';
import { callMcpTool } from './mcp-client';
import { cloneJson, foldRootComposition } from './schema';
import type {
	AISDKToolDefinition,
	AISDKToolResult,
	ClaudeAgentSdkOptions,
	ExecuteConfig,
	ExecuteOptions,
	JsonObject,
	JSONSchema,
	McpExecuteConfig,
	ToolExecution,
	ToolParameters,
} from './types';
import { StackOneAPIError } from './utils/error-stackone-api';
import { StackOneError } from './utils/error-stackone';
import { ToolArgumentsError } from './utils/error-tool-arguments';
import { warn } from './utils/logger';
import { serializeToolResult } from './utils/serialize';
import { tryImport } from './utils/try-import';

/**
 * JSON Schema with type narrowed to 'object'
 * Used for tool parameter schemas which are always objects
 */
type ObjectJSONSchema = OverrideProperties<JSONSchema, { type: 'object' }>;

/**
 * A JSON object: a non-null, non-array value whose prototype is `Object.prototype` or `null`.
 *
 * `typeof value === 'object' && !Array.isArray(value)` alone also accepts a `Date`, `Map`,
 * `Set`, `RegExp` or class instance — none of which are JSON objects, and some of which
 * `JSON.stringify` would otherwise convert silently (a `Date` to a string, a `Map` to `{}`)
 * rather than refuse.
 */
const isPlainObject = (value: unknown): value is JsonObject => {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		return false;
	}
	const prototype: unknown = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
};

/**
 * Base class for all tools: a name, a description, the served parameter schema, and conversions
 * to each framework's tool format.
 *
 * `BaseTool` itself cannot execute anything. The tools a {@link StackOneToolSet} returns execute
 * over MCP `tools/call`; a hand-built tool must override {@link BaseTool.execute}.
 */
export class BaseTool {
	name: string;
	description: string;
	parameters: ToolParameters;
	executeConfig: ExecuteConfig;
	#exposeExecutionMetadata = true;

	constructor(
		name: string,
		description: string,
		parameters: ToolParameters,
		executeConfig: ExecuteConfig,
	) {
		this.name = name;
		this.description = description;
		this.parameters = parameters;
		this.executeConfig = executeConfig;
	}

	/**
	 * Control whether execution metadata should be exposed in AI SDK conversions.
	 */
	setExposeExecutionMetadata(expose: boolean): this {
		this.#exposeExecutionMetadata = expose;
		return this;
	}

	/**
	 * Execute the tool with the provided parameters.
	 *
	 * @throws StackOneError Always, on a `BaseTool`: override this to make a tool executable.
	 */
	async execute(
		_inputParams?: JsonObject | string,
		_options?: ExecuteOptions,
	): Promise<JsonObject> {
		throw new StackOneError(
			`Tool ${JSON.stringify(this.name)} has no executor. Override execute() to run a hand-built tool.`,
		);
	}

	/**
	 * The served parameter schema, verbatim, as a fresh deep copy.
	 *
	 * Lossless and framework-agnostic: every root keyword the server sent — `$schema`, `$defs`,
	 * `$ref`, `title`, `additionalProperties`, top-level `oneOf`/`anyOf`/`allOf` — and every
	 * nested constraint reaches the caller unchanged, with the served `required` list. Use this
	 * for any framework that accepts JSON Schema; the provider adapters below start from it.
	 */
	toJsonSchema(): ObjectJSONSchema {
		const { required, ...rest } = cloneJson(this.parameters);
		const schema: Record<string, unknown> = {
			...rest,
			type: rest.type || 'object',
			properties: rest.properties ?? {},
		};
		if (Array.isArray(required) && required.length > 0) {
			schema.required = required;
		}
		return schema as ObjectJSONSchema;
	}

	/**
	 * {@link toJsonSchema}, adjusted for providers that require a plain object at the root.
	 *
	 * The OpenAI and Anthropic tool APIs both reject a parameters schema with a top-level
	 * `oneOf`/`anyOf`/`allOf`; see {@link foldRootComposition} for how it is folded rather than
	 * lost. Everything else is passed through.
	 */
	#toProviderSchema(): ObjectJSONSchema {
		return foldRootComposition(this.toJsonSchema()) as ObjectJSONSchema;
	}

	#createExecutionMetadata(): ToolExecution {
		return { config: cloneJson(this.executeConfig) };
	}

	/**
	 * Convert the tool to OpenAI Chat Completions API format.
	 *
	 * The schema is {@link toJsonSchema} with any top-level `oneOf`/`anyOf`/`allOf`/`enum`/`not`
	 * folded into the root, which Chat Completions rejects.
	 */
	toOpenAI(): ChatCompletionFunctionTool {
		return {
			type: 'function',
			function: {
				name: this.name,
				description: this.description,
				parameters: this.#toProviderSchema(),
			},
		};
	}

	/**
	 * Convert the tool to Anthropic format.
	 *
	 * The schema is {@link toJsonSchema} with any top-level `oneOf`/`anyOf`/`allOf` folded into
	 * the root: the Messages API rejects `input_schema` with a combinator at the top level.
	 *
	 * @see https://docs.anthropic.com/en/docs/build-with-claude/tool-use
	 */
	toAnthropic(): AnthropicTool {
		return {
			name: this.name,
			description: this.description,
			input_schema: this.#toProviderSchema(),
		};
	}

	/**
	 * Convert the tool to OpenAI Responses API format.
	 *
	 * With `strict` (the default) the root schema is closed with `additionalProperties: false`,
	 * replacing whatever the server served there. The SDK does not rewrite anything nested:
	 * OpenAI's strict mode additionally requires every property to be listed in `required` and
	 * every nested object to be closed, so a served schema with optional fields is rejected by
	 * OpenAI in strict mode. Pass `{ strict: false }` for those — the served schema then goes
	 * through unchanged apart from the top-level composition fold.
	 *
	 * @see https://platform.openai.com/docs/api-reference/responses
	 * @see https://platform.openai.com/docs/guides/structured-outputs#supported-schemas
	 */
	toOpenAIResponses(options: { strict?: boolean } = {}): OpenAIResponsesFunctionTool {
		const { strict = true } = options;
		return {
			type: 'function',
			name: this.name,
			description: this.description,
			strict,
			parameters: {
				...this.#toProviderSchema(),
				...(strict ? { additionalProperties: false } : {}),
			},
		};
	}

	/**
	 * Convert the tool to Claude Agent SDK format.
	 * Returns a tool definition compatible with the Claude Agent SDK's tool() function.
	 *
	 * The schema is the one {@link toAnthropic} uses. Results are handed back as JSON text, with
	 * file bytes base64-encoded.
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
		const ai = await tryImport<typeof import('ai')>(
			'ai',
			`npm install ai (requires ${peerDependencies.ai})`,
		);
		const inputSchema = ai.jsonSchema(this.#toProviderSchema() as AISDKJSONSchema);
		const execute = this.execute.bind(this);

		return {
			name: this.name,
			description: this.description,
			inputSchema,
			handler: async (args: Record<string, unknown>) => {
				const result = await execute(args as JsonObject);
				return {
					content: [{ type: 'text' as const, text: serializeToolResult(result) }],
				};
			},
		};
	}

	/**
	 * Convert the tool to AI SDK format.
	 *
	 * The schema is {@link toJsonSchema} with top-level composition folded (the AI SDK hands it
	 * to whichever provider you use, and OpenAI and Anthropic both reject it), and with the root
	 * closed by `additionalProperties: false`, replacing whatever the server served there. This
	 * matches what the AI SDK's OpenAI provider needs for strict structured outputs; nested
	 * objects are passed through as served.
	 */
	async toAISDK(
		options: { executable?: boolean; execution?: ToolExecution | false } = {
			executable: true,
		},
	): Promise<AISDKToolResult> {
		const schema = {
			...this.#toProviderSchema(),
			additionalProperties: false,
		} as AISDKJSONSchema;

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
					? this.#createExecutionMetadata()
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
 * A tool served by StackOne, bound to the account it was listed for.
 */
export class StackOneTool extends BaseTool {
	#accountId: string | undefined;

	constructor(
		name: string,
		description: string,
		parameters: ToolParameters,
		executeConfig: ExecuteConfig,
		accountId?: string,
	) {
		super(name, description, parameters, executeConfig);
		this.#accountId = accountId;
	}

	/**
	 * Get the account this tool executes against.
	 */
	getAccountId(): string | undefined {
		return this.#accountId;
	}

	/**
	 * Rebind this tool to another account. The tools `fetchTools()` returns are built fresh per
	 * call, so this never affects another caller's tools.
	 */
	setAccountId(accountId: string | undefined): this {
		this.#accountId = accountId;
		return this;
	}

	/**
	 * Parse tool arguments: a JSON string, an object, or nothing.
	 *
	 * @throws ToolArgumentsError If the arguments are not a JSON object.
	 */
	protected parseArguments(input: JsonObject | string | undefined): JsonObject {
		if (input === undefined || input === null) {
			return {};
		}
		let parsed: unknown = input;
		if (typeof input === 'string') {
			try {
				parsed = JSON.parse(input);
			} catch (error) {
				throw new ToolArgumentsError(
					`Invalid JSON in arguments for ${JSON.stringify(this.name)}: ${error instanceof Error ? error.message : String(error)}`,
					{ cause: error },
				);
			}
		}
		if (!isPlainObject(parsed)) {
			throw new ToolArgumentsError(
				`Tool arguments for ${JSON.stringify(this.name)} must be a JSON object`,
			);
		}
		return { ...parsed };
	}
}

/**
 * A tool executed over MCP `tools/call`, on the endpoint and account that listed it. Every tool a
 * {@link StackOneToolSet} returns is one: per-action tools, the `search_execute` meta tools, and
 * `stackone_submit_feedback`.
 */
export class StackOneMcpTool extends StackOneTool {
	readonly #endpoint: string;
	readonly #apiKey: string;
	readonly #extraHeaders: Record<string, string>;
	readonly #timeout: number;
	readonly #declaredHeaders: DeclaredHeaders;

	constructor(options: {
		name: string;
		description: string;
		parameters: ToolParameters;
		endpoint: string;
		apiKey: string;
		accountId?: string;
		timeout: number;
		extraHeaders?: Record<string, string>;
	}) {
		const executeConfig = {
			kind: 'mcp',
			url: options.endpoint,
			toolName: options.name,
		} as const satisfies McpExecuteConfig;
		super(options.name, options.description, options.parameters, executeConfig, options.accountId);
		this.setExposeExecutionMetadata(false);
		this.#endpoint = options.endpoint;
		this.#apiKey = options.apiKey;
		this.#extraHeaders = { ...options.extraHeaders };
		this.#timeout = options.timeout;
		this.#declaredHeaders = declaredHeaders(options.parameters.properties);
	}

	/**
	 * Call the tool.
	 *
	 * Arguments are sent as given; the server maps them onto the action. Header arguments — the
	 * entries of a `headers` object, and `headers_<name>` arguments — are the exception: these
	 * arguments are model-controlled, so each is forwarded only if this tool's own schema declares
	 * it, and `Authorization`, `x-account-id` and `User-Agent` never are. A `headers` property
	 * served as an object with no `properties`, as on `*_execute_action`, declares every name.
	 *
	 * @returns The result as the server wrote it: for an action tool, an `ActionResult`,
	 *   `{ isError: false, result, defenderMetadata?, policyMetadata? }`. A file action's `result`
	 *   is the server's single-use `download_url`, not the file. Typed `JsonObject` rather than
	 *   `ActionResult`, since a `*_search_actions` meta tool returns bare JSON and `dryRun` the
	 *   call it would send: assert `ActionResult` on an action tool.
	 * @throws ToolArgumentsError If the arguments are not a JSON object or cannot be encoded as
	 *   JSON.
	 * @throws StackOneAPIError If the result carries `isError`, with the status from its payload,
	 *   or the endpoint answers with an HTTP error.
	 * @throws ToolSetLoadError If the endpoint cannot be reached or does not answer in time.
	 */
	override async execute(
		inputParams?: JsonObject | string,
		options?: ExecuteOptions,
	): Promise<JsonObject> {
		const parsed = this.parseArguments(inputParams);
		const args = sanitiseHeaderArguments(parsed, this.#declaredHeaders);
		assertEncodable(this.name, args);

		if (options?.dryRun) {
			return { url: this.#endpoint, method: 'tools/call', name: this.name, arguments: args };
		}

		return callMcpTool(
			{
				endpoint: this.#endpoint,
				headers: buildRequestHeaders({
					apiKey: this.#apiKey,
					accountId: this.getAccountId(),
					extraHeaders: this.#extraHeaders,
				}),
				timeout: this.#timeout,
			},
			this.name,
			args,
		);
	}
}

/**
 * Describe why `value` is not a JSON value, for the message {@link assertJsonValue} throws.
 */
function describeUnencodableType(value: unknown): string {
	if (typeof value === 'bigint') {
		return 'a bigint';
	}
	if (typeof value === 'symbol') {
		return 'a symbol';
	}
	if (typeof value === 'function') {
		return 'a function';
	}
	if (value instanceof Date) {
		return 'a Date';
	}
	if (value instanceof Map) {
		return 'a Map';
	}
	if (value instanceof Set) {
		return 'a Set';
	}
	if (value instanceof RegExp) {
		return 'a RegExp';
	}
	if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer) {
		return 'binary data';
	}
	return `an instance of ${(value as object).constructor?.name ?? typeof value}`;
}

/** A ToolArgumentsError for arguments that cannot be encoded as JSON. */
const unencodable = (toolName: string, detail: string): ToolArgumentsError =>
	new ToolArgumentsError(
		`Arguments for ${JSON.stringify(toolName)} could not be encoded as JSON: ${detail}`,
	);

/**
 * A UTF-16 surrogate without its other half: what a model emits when a token boundary splits an
 * emoji. `JSON.stringify` escapes it as `\ud800` rather than refusing it, but it is not Unicode
 * text, so it cannot be encoded as UTF-8 — Python refuses it, and so does this.
 */
const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

/**
 * Walk `value`, throwing if it, or anything nested inside it, is not a JSON value.
 *
 * Only `null`, booleans, finite numbers, strings, arrays and plain objects are JSON values.
 * `JSON.stringify` quietly converts some of what this refuses — a `Date` to a string, a `Map`
 * or `Set` to `{}` — rather than refuse it, which would silently send the model a value it
 * never supplied. `undefined` is dropped, as `JSON.stringify` drops it from an object, but is
 * refused inside an array, where `JSON.stringify` would send it as `null`. A string or key
 * holding a lone surrogate is refused too.
 *
 * @throws ToolArgumentsError If `value` is not a JSON value.
 */
function assertJsonValue(value: unknown, path: string, toolName: string, seen: Set<object>): void {
	if (value === null || typeof value === 'boolean') {
		return;
	}
	if (typeof value === 'string') {
		if (LONE_SURROGATE.test(value)) {
			throw unencodable(
				toolName,
				`a string holding a lone surrogate is not Unicode text (at ${JSON.stringify(path)})`,
			);
		}
		return;
	}
	if (typeof value === 'number') {
		if (!Number.isFinite(value)) {
			throw unencodable(toolName, `${value} is not a JSON number`);
		}
		return;
	}
	if (Array.isArray(value)) {
		if (seen.has(value)) {
			throw unencodable(toolName, `circular reference (at ${JSON.stringify(path)})`);
		}
		seen.add(value);
		for (let index = 0; index < value.length; index++) {
			const item = value[index];
			const itemPath = `${path}[${index}]`;
			if (item === undefined) {
				throw unencodable(
					toolName,
					`undefined is not a JSON value (at ${JSON.stringify(itemPath)})`,
				);
			}
			assertJsonValue(item, itemPath, toolName, seen);
		}
		seen.delete(value);
		return;
	}
	if (isPlainObject(value)) {
		if (seen.has(value)) {
			throw unencodable(toolName, `circular reference (at ${JSON.stringify(path)})`);
		}
		seen.add(value);
		for (const [key, entry] of Object.entries(value)) {
			// An object property set to undefined is treated as absent, as JSON.stringify treats it.
			if (entry === undefined) {
				continue;
			}
			assertJsonKey(key, path, toolName);
			assertJsonValue(entry, `${path}.${key}`, toolName, seen);
		}
		seen.delete(value);
		return;
	}
	throw unencodable(
		toolName,
		`${describeUnencodableType(value)} is not a JSON value (at ${JSON.stringify(path)})`,
	);
}

/**
 * Throw if an object key holds a lone surrogate. `path` is where the object is, if anywhere.
 *
 * @throws ToolArgumentsError If the key is not Unicode text.
 */
function assertJsonKey(key: string, path: string | undefined, toolName: string): void {
	if (LONE_SURROGATE.test(key)) {
		const where = path === undefined ? '' : ` (in ${JSON.stringify(path)})`;
		throw unencodable(toolName, `a key holding a lone surrogate is not Unicode text${where}`);
	}
}

/**
 * Throw if `args` cannot be sent as JSON: see {@link assertJsonValue}.
 *
 * @throws ToolArgumentsError If any value, however deeply nested, is not a JSON value.
 */
function assertEncodable(toolName: string, args: JsonObject): void {
	for (const [key, value] of Object.entries(args)) {
		if (value === undefined) {
			continue;
		}
		assertJsonKey(key, undefined, toolName);
		assertJsonValue(value, key, toolName, new Set());
	}
}

/**
 * A Chat Completions tool call: the `openai` package's own object, or the same shape as a plain
 * object (for example one read back from storage).
 */
type OpenAIToolCall =
	| ChatCompletionMessageToolCall
	| {
			id: string;
			type?: string;
			function?: { name: string; arguments?: string | JsonObject | null };
	  };

/** Pull the id, name and arguments out of a tool call, or say why it cannot be run. */
function readOpenAIToolCall(call: OpenAIToolCall): {
	id: string;
	name: string;
	args: string | JsonObject;
	unsupported?: string;
} {
	const id = String(call.id ?? '');
	if (!('function' in call) || !call.function) {
		return {
			id,
			name: '',
			args: {},
			unsupported: `Unsupported tool call type "${String(call.type)}"`,
		};
	}
	const { name, arguments: args } = call.function;
	return { id, name: String(name), args: args || {} };
}

/**
 * Collection of tools with utility methods
 */
export class Tools implements Iterable<BaseTool> {
	private tools: BaseTool[];

	constructor(tools: BaseTool[]) {
		this.tools = [...tools];
	}

	/**
	 * Get the number of tools in the collection
	 */
	get length(): number {
		return this.tools.length;
	}

	/**
	 * Get a tool by name. When two accounts serve the same name, this is the first one listed.
	 */
	getTool(name: string): BaseTool | undefined {
		return this.tools.find((tool) => tool.name === name);
	}

	/**
	 * The first tool of each name, in order: the one {@link getTool} returns. Every adapter is
	 * built from these, so a model can never call a tool that a lookup by name would not find —
	 * an AI SDK record would keep the last, OpenAI would get two functions of one name, and the
	 * Claude Agent SDK refuses the second outright.
	 */
	#uniqueTools(): BaseTool[] {
		warnOnDuplicateNames(this.tools);
		const seen = new Set<string>();
		return this.tools.filter((tool) => !seen.has(tool.name) && seen.add(tool.name));
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
		return this.#uniqueTools().map((tool) => ({
			name: tool.name,
			description: tool.description,
			parameters: tool.toJsonSchema(),
		}));
	}

	/**
	 * Convert all tools to OpenAI Chat Completions API format
	 */
	toOpenAI(): ChatCompletionFunctionTool[] {
		return this.#uniqueTools().map((tool) => tool.toOpenAI());
	}

	/**
	 * Run a Chat Completions response's tool calls and return the `tool` messages to send back.
	 *
	 * The counterpart to {@link toOpenAI}: that turns these tools into what OpenAI accepts, this
	 * turns what OpenAI returns back into messages for it. Append the assistant message first,
	 * then these, in order:
	 *
	 * ```typescript
	 * const message = response.choices[0].message;
	 * messages.push(message, ...(await tools.executeOpenAIToolCalls(message.tool_calls)));
	 * ```
	 *
	 * A failed call does not throw. Its error — with the server's response body, when there is
	 * one — becomes the tool message's content, so the model can read why and retry. A call to a
	 * tool that is not in this collection is reported the same way. Calls run one at a time, in
	 * order. File bytes in a result are base64-encoded.
	 */
	async executeOpenAIToolCalls(
		toolCalls: readonly OpenAIToolCall[] | null | undefined,
	): Promise<ChatCompletionToolMessageParam[]> {
		const messages: ChatCompletionToolMessageParam[] = [];
		for (const call of toolCalls ?? []) {
			const { id, name, args, unsupported } = readOpenAIToolCall(call);
			const tool = unsupported ? undefined : this.getTool(name);
			let result: unknown;
			if (unsupported) {
				result = { error: unsupported };
			} else if (!tool) {
				result = { error: `Unknown tool ${JSON.stringify(name)}` };
			} else {
				try {
					result = await tool.execute(args);
				} catch (error) {
					if (!(error instanceof StackOneError)) {
						throw error;
					}
					const body = error instanceof StackOneAPIError ? error.responseBody : undefined;
					result = {
						error: error.message,
						...(body != null && body !== '' ? { response_body: body } : {}),
					};
				}
			}
			messages.push({ role: 'tool', tool_call_id: id, content: serializeToolResult(result) });
		}
		return messages;
	}

	/**
	 * Convert all tools to Anthropic format
	 * @see https://docs.anthropic.com/en/docs/build-with-claude/tool-use
	 */
	toAnthropic(): AnthropicTool[] {
		return this.#uniqueTools().map((tool) => tool.toAnthropic());
	}

	/**
	 * Convert all tools to OpenAI Responses API format
	 * @see https://platform.openai.com/docs/api-reference/responses
	 */
	toOpenAIResponses(options: { strict?: boolean } = {}): OpenAIResponsesFunctionTool[] {
		return this.#uniqueTools().map((tool) => tool.toOpenAIResponses(options));
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
		for (const tool of this.#uniqueTools()) {
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
			this.#uniqueTools().map(async (baseTool) => {
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

/**
 * Two accounts on one provider serve identically named tools. Every lookup and adapter keeps the
 * first one listed — the lowest account id — and drops the rest, so warn that the others are
 * unreachable by name: once when the tools are fetched, and again from each adapter that drops
 * them.
 */
export function warnOnDuplicateNames(tools: readonly BaseTool[]): void {
	const counts = new Map<string, number>();
	for (const tool of tools) {
		counts.set(tool.name, (counts.get(tool.name) ?? 0) + 1);
	}
	const clashing = [...counts]
		.filter(([name, count]) => count > 1 && name !== SUBMIT_FEEDBACK_TOOL_NAME)
		.map(([name]) => name)
		.sort();
	if (clashing.length > 0) {
		warn(
			`${clashing.length} tool name(s) are served by more than one account (${clashing.slice(0, 5).join(', ')}). The first one listed, from the lowest account id, is used — pass account ids to choose.`,
		);
	}
}
