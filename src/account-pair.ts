/**
 * The one-account pair, presented as the trio's search and execute tools.
 *
 * Asked for `search_execute` over a single account, the MCP endpoint serves
 * `<connector>_<accountId>_search_actions` and `<connector>_<accountId>_execute_action` instead
 * of the trio. The SDK presents them as `stackone_search_actions` and `stackone_execute_action`,
 * so a model, and `search()` / `execute()`, see one pair of names however many accounts are in
 * scope.
 */
import { EXECUTE_ACTION_TOOL_NAME, SEARCH_ACTIONS_TOOL_NAME } from './consts';
import type { McpToolDefinition } from './mcp-client';
import { StackOneMcpTool } from './tool';
import type { StackOneMcpToolOptions } from './tool';
import type { ExecuteOptions, JsonObject, JsonValue } from './types';
import { StackOneAPIError } from './utils/error-stackone-api';
import { ToolArgumentsError } from './utils/error-tool-arguments';

/** A served pair: the account and connector it runs on, and the name each tool is presented under. */
export interface AccountPair {
	accountId: string;
	connector: string;
	/** Each served name, and the trio's name it is presented under. */
	names: ReadonlyMap<string, string>;
}

/** The served suffix of each pair tool, and the trio's name for it. */
const PAIR_SUFFIXES = [
	['_search_actions', SEARCH_ACTIONS_TOOL_NAME],
	['_execute_action', EXECUTE_ACTION_TOOL_NAME],
] as const;

/**
 * The pair a one-account listing serves, read from its tool names, or `undefined` when it serves
 * none. The connector is a served name minus `_<accountId>_search_actions` (or
 * `_execute_action`).
 */
export function accountPairOf(
	definitions: readonly McpToolDefinition[],
	accountId: string,
): AccountPair | undefined {
	for (const { name } of definitions) {
		for (const [suffix] of PAIR_SUFFIXES) {
			const ending = `_${accountId}${suffix}`;
			if (name.length > ending.length && name.endsWith(ending)) {
				const connector = name.slice(0, -ending.length);
				const names = new Map(
					PAIR_SUFFIXES.map(([served, trioName]) => [
						`${connector}_${accountId}${served}`,
						trioName,
					]),
				);
				return { accountId, connector, names };
			}
		}
	}
	return undefined;
}

/**
 * A served pair tool under the trio's name. Its description, schema and results read the trio's
 * names wherever the served ones appear; it takes the trio's `stackone_account_id` and `provider`
 * when they name its own account and connector; and its search hits name the account and
 * connector, as the trio's do.
 */
export class StackOneAccountPairTool extends StackOneMcpTool {
	readonly #pair: AccountPair;

	constructor(options: StackOneMcpToolOptions, pair: AccountPair) {
		super({
			...options,
			name: pair.names.get(options.name) ?? options.name,
			servedName: options.name,
			description: renameServedTools(options.description, pair),
			parameters: renameServedTools(options.parameters, pair),
		});
		this.#pair = pair;
	}

	/**
	 * Call the served tool.
	 *
	 * @throws ToolArgumentsError If `stackone_account_id` or `provider` names an account or
	 *   connector other than the pair's own, before any request.
	 * @throws StackOneAPIError As {@link StackOneMcpTool.execute}, its text in the trio's names.
	 */
	override async execute(
		inputParams?: JsonObject | string,
		options?: ExecuteOptions,
	): Promise<JsonObject> {
		const args = withoutScopeArguments(this.parseArguments(inputParams), this.name, this.#pair);
		const result = await super.execute(args, options).catch((error: unknown) => {
			throw error instanceof StackOneAPIError ? renamedError(error, this.#pair) : error;
		});
		if (options?.dryRun === true) {
			return result;
		}
		const renamed = renameServedTools(result, this.#pair);
		return this.name === SEARCH_ACTIONS_TOOL_NAME ? withHitsScoped(renamed, this.#pair) : renamed;
	}
}

/**
 * The arguments without `stackone_account_id` and `provider`, which the trio takes and the pair
 * does not. Each is dropped when it names the pair's own account or connector (the connector
 * case-insensitively), and refused otherwise: the pair cannot reach any other. `null` is not
 * given.
 */
function withoutScopeArguments(args: JsonObject, tool: string, pair: AccountPair): JsonObject {
	const { stackone_account_id: accountId, provider, ...rest } = args;
	if (accountId != null && accountId !== pair.accountId) {
		throw new ToolArgumentsError(
			`stackone_account_id ${JSON.stringify(accountId)} is not an account ${JSON.stringify(tool)} can run on; it runs on ${JSON.stringify(pair.accountId)}.`,
		);
	}
	if (
		provider != null &&
		(typeof provider !== 'string' || provider.toLowerCase() !== pair.connector.toLowerCase())
	) {
		throw new ToolArgumentsError(
			`provider ${JSON.stringify(provider)} is not linked in this account scope, which has ${JSON.stringify(pair.connector)}.`,
		);
	}
	return rest;
}

/** A failed call's error, its message and body in the trio's names, caused by the served one. */
function renamedError(error: StackOneAPIError, pair: AccountPair): StackOneAPIError {
	return new StackOneAPIError(
		renameServedTools(error.message, pair),
		error.statusCode,
		renameServedTools(error.responseBody, pair),
		error.requestBody,
		{ cause: error },
	);
}

/** `value` with every served pair name in its strings replaced by the trio's name for it. */
function renameServedTools<T>(value: T, pair: AccountPair): T {
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- renaming strings keeps every value's shape
	return renamedValue(value, pair) as T;
}

function renamedValue(value: unknown, pair: AccountPair): unknown {
	if (typeof value === 'string') {
		let renamed = value;
		for (const [served, trioName] of pair.names) {
			renamed = renamed.replaceAll(served, trioName);
		}
		return renamed;
	}
	if (Array.isArray(value)) {
		return value.map((item: unknown) => renamedValue(item, pair));
	}
	if (typeof value === 'object' && value !== null) {
		return Object.fromEntries(
			Object.entries(value).map(([key, item]) => [key, renamedValue(item, pair)]),
		);
	}
	return value;
}

/** A pair's search result, each hit naming its account and connector where it does not already. */
function withHitsScoped(result: JsonObject, pair: AccountPair): JsonObject {
	if (!Array.isArray(result.actions)) {
		return result;
	}
	const actions = result.actions.map((hit) =>
		isJsonObject(hit)
			? {
					...hit,
					provider: hit.provider ?? pair.connector,
					available_accounts: hit.available_accounts ?? [{ id: pair.accountId }],
				}
			: hit,
	);
	return { ...result, actions };
}

const isJsonObject = (value: JsonValue | undefined): value is JsonObject =>
	typeof value === 'object' && value !== null && !Array.isArray(value);
