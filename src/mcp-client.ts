import { STATUS_CODES } from 'node:http';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import {
	StreamableHTTPClientTransport,
	StreamableHTTPError,
} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { version } from '../package.json';
import type { JsonObject } from './types';
import { StackOneAPIError } from './utils/error-stackone-api';
import { StackOneError } from './utils/error-stackone';
import { ToolSetLoadError } from './utils/error-toolset';
import { fetchWithRetry, retryTiming } from './utils/fetch-retry';

/** A tool exactly as the MCP server listed it. */
export interface McpToolDefinition {
	name: string;
	description?: string;
	inputSchema: Record<string, unknown>;
}

interface McpRequest {
	endpoint: string;
	/** The complete HTTP headers, credentials and account included. */
	headers: Record<string, string>;
	/** Deadline for the whole exchange, handshake included, in milliseconds. */
	timeout: number;
}

/** Raised by the overall deadline, so it can be told apart from a transport failure. */
class McpDeadlineError extends Error {
	constructor(timeout: number) {
		super(`no response within ${timeout}ms`);
		this.name = 'McpDeadlineError';
	}
}

/** The prefix the transport puts in front of the server's response body. */
const TRANSPORT_ERROR_PREFIX = /^Streamable HTTP error: Error POSTing to endpoint:\s*/;

const parseBody = (text: string): unknown => {
	if (!text) {
		return null;
	}
	try {
		return JSON.parse(text) as unknown;
	} catch {
		return text;
	}
};

/**
 * Turn the MCP client's failure into something a caller can act on.
 *
 * An HTTP error arrives as the transport's own error type, whose message buries the status in
 * boilerplate. Unwrap it into a {@link StackOneAPIError} carrying the status and the response
 * body — which is where the server explains itself: a dead account, for example, answers 412
 * with "re-link the account to resume". Anything else is reported by its innermost cause.
 */
export function describeMcpFailure(error: unknown, endpoint: string, timeout: number): Error {
	if (error instanceof StackOneError) {
		return error;
	}
	if (error instanceof StreamableHTTPError && typeof error.code === 'number' && error.code > 0) {
		const text = error.message.replace(TRANSPORT_ERROR_PREFIX, '').trim();
		const detail = text ? `: ${text}` : '';
		const reason = STATUS_CODES[error.code] ?? '';
		return new StackOneAPIError(
			`MCP request to ${endpoint} failed with ${error.code} ${reason}`.trimEnd() + detail,
			error.code,
			parseBody(text),
			undefined,
			{ cause: error },
		);
	}
	if (isTimeout(error)) {
		// In seconds, written as a number (0.5s, 60s), as the Python SDK writes it.
		return new ToolSetLoadError(`MCP request to ${endpoint} timed out after ${timeout / 1000}s`, {
			cause: error,
		});
	}
	let leaf: unknown = error;
	while (leaf instanceof Error && leaf.cause !== undefined) {
		leaf = leaf.cause;
	}
	const description = leaf instanceof Error ? `${leaf.name}: ${leaf.message}` : String(leaf);
	return new ToolSetLoadError(`MCP request to ${endpoint} failed: ${description}`, {
		cause: error,
	});
}

/**
 * Whether an MCP request was still rate limited after its retries: an HTTP 429 from the endpoint.
 *
 * Unlike a dead account, this says nothing about one account and everything about the API key,
 * so a fan-out must fail on it rather than skip the account and return a partial catalog. A
 * `tools/call` result whose payload reports 429 is not this: the request itself was served.
 */
export function isRateLimitFailure(error: unknown): boolean {
	return (
		error instanceof StackOneAPIError &&
		error.statusCode === 429 &&
		(error.cause instanceof StreamableHTTPError ||
			error.cause instanceof RateLimitTimeoutError ||
			error.cause instanceof HttpRateLimitError)
	);
}

/**
 * The cause of a `StackOneAPIError` 429 that a plain HTTP request (`GET /accounts`) was answered
 * with after its retries, so {@link isRateLimitFailure} reads it as the rate limit it is.
 */
export class HttpRateLimitError extends Error {
	constructor(url: string) {
		super(`${url} answered 429 after every retry`);
		this.name = 'HttpRateLimitError';
	}
}

/**
 * Whether an MCP request was refused by the API's end-user check on `accountId`: the 400 it
 * answers a non-shared account's request with when `x-end-user-id` does not name its end user.
 */
function isEndUserMismatch(error: unknown, accountId: string): boolean {
	if (!(error instanceof StackOneAPIError) || error.statusCode !== 400) {
		return false;
	}
	const body = error.responseBody;
	const message =
		typeof body === 'object' && body !== null && 'message' in body ? body.message : body;
	// The guard's fixed wording, ending with this account's id, quoted or not: not an exact string,
	// so a change to how the id is written does not silently turn the lookup off.
	if (
		typeof message !== 'string' ||
		!message.startsWith('x-end-user-id header does not match account end user id')
	) {
		return false;
	}
	return (
		message
			.trimEnd()
			.split(' ')
			.pop()
			?.replace(/^["']|["']$/g, '') === accountId
	);
}

/** How a request finds the end user to send as `x-end-user-id` for an account. */
export interface EndUserSource {
	/** The end user recorded for the account, if any. */
	recorded: (accountId: string) => string | undefined;
	/** Look the account's end user up with `GET /accounts`, and return what is then recorded. */
	lookUp: (accountId: string) => Promise<string | undefined>;
}

/**
 * Run an MCP request for `accountId` with its recorded end user, if any.
 *
 * An account id passed explicitly has no end user recorded until something calls
 * `GET /accounts`, so a non-shared one is refused with a 400. When that happens to an account
 * with nothing recorded, its end user is looked up once and, if there is one, the request is sent
 * again with it. Otherwise the 400 is thrown as it came — with the lookup's error as its `cause`,
 * if the lookup failed.
 */
export async function withEndUser<T>(
	accountId: string | undefined,
	source: EndUserSource | undefined,
	request: (endUserId: string | undefined) => Promise<T>,
): Promise<T> {
	const recorded = accountId && source ? source.recorded(accountId) : undefined;
	try {
		return await request(recorded);
	} catch (error) {
		if (!accountId || !source || recorded !== undefined || !isEndUserMismatch(error, accountId)) {
			throw error;
		}
		// A failed lookup leaves the refusal to be thrown, with the lookup's error as its cause —
		// a key without platform.read would otherwise be told only that the header is wrong. A rate
		// limit is thrown instead: that is the key's, not the account's, and must stay fatal to a
		// fan-out.
		let endUserId: string | undefined;
		try {
			endUserId = await source.lookUp(accountId);
		} catch (lookupError) {
			if (isRateLimitFailure(lookupError)) {
				throw lookupError;
			}
			const refusal = error as StackOneAPIError;
			throw new StackOneAPIError(
				refusal.message,
				refusal.statusCode,
				refusal.responseBody,
				refusal.requestBody,
				{ cause: lookupError },
			);
		}
		if (endUserId === undefined) {
			throw error;
		}
		return request(endUserId);
	}
}

/** A session that timed out while a 429 was being retried. */
class RateLimitTimeoutError extends Error {
	constructor(options: ErrorOptions) {
		super('timed out while retrying a 429', options);
		this.name = 'RateLimitTimeoutError';
	}
}

const isTimeout = (error: unknown): boolean =>
	error instanceof McpDeadlineError ||
	(error instanceof McpError && error.code === ErrorCode.RequestTimeout);

/**
 * Open an MCP session, run `work` in it and close it, all within one deadline.
 *
 * The MCP client's own defaults are generous and apply per request, so a host that accepts the
 * connection and never answers would hold a listing open far longer than the toolset's
 * `timeout`. The whole exchange is bounded instead, and closing the client on expiry aborts the
 * in-flight request.
 */
async function withMcpSession<T>(
	{ endpoint, headers, timeout }: McpRequest,
	work: (client: Client) => Promise<T>,
): Promise<T> {
	const expiresAt = retryTiming.now() + timeout;
	// Whether the request currently in flight is waiting out a 429. Cleared as soon as a retry is
	// answered with anything else, as in Python: a 429 that cleared must not make a later timeout
	// — a stalled stream on that same response, or an unrelated request — look like a rate limit.
	let rateLimited = false;
	const transport = new StreamableHTTPClientTransport(new URL(endpoint), {
		requestInit: { headers },
		// Every request the client sends, handshake included, so it never sees a 429 it could
		// have waited out — but never one that would outlast the session's deadline.
		fetch: async (url, init) => {
			rateLimited = false;
			const response = await fetchWithRetry(url, init, {
				deadline: expiresAt,
				onRetry: () => {
					rateLimited = true;
				},
			});
			if (response.status !== 429) {
				rateLimited = false;
			}
			return response;
		},
	});
	const client = new Client({ name: 'stackone-ai-node', version });
	let timer: ReturnType<typeof setTimeout> | undefined;
	const deadline = new Promise<never>((_resolve, reject) => {
		timer = setTimeout(() => reject(new McpDeadlineError(timeout)), timeout);
	});
	try {
		const session = (async () => {
			await client.connect(transport, { timeout });
			return work(client);
		})();
		return await Promise.race([session, deadline]);
	} catch (error) {
		// A timeout while a 429 was being retried is the rate limit's doing, not the account's:
		// reported as a timeout, it would skip the account and return a partial result, which a
		// 429 must never do.
		if (rateLimited && isTimeout(error)) {
			throw new StackOneAPIError(
				`MCP request to ${endpoint} was rate limited (429) and timed out after ${timeout / 1000}s while retrying`,
				429,
				null,
				undefined,
				{ cause: new RateLimitTimeoutError({ cause: error }) },
			);
		}
		throw describeMcpFailure(error, endpoint, timeout);
	} finally {
		clearTimeout(timer);
		await client.close().catch(() => undefined);
	}
}

/**
 * List every tool the MCP endpoint serves, following pagination.
 */
export async function listMcpTools(request: McpRequest): Promise<McpToolDefinition[]> {
	return withMcpSession(request, async (client) => {
		const collected: McpToolDefinition[] = [];
		let cursor: string | undefined;
		do {
			const page = await client.listTools(cursor ? { cursor } : undefined, {
				timeout: request.timeout,
			});
			for (const tool of page.tools) {
				collected.push({
					name: tool.name,
					description: tool.description,
					inputSchema: (tool.inputSchema ?? {}) as Record<string, unknown>,
				});
			}
			cursor = page.nextCursor;
		} while (cursor);
		return collected;
	});
}

interface ContentPart {
	type: string;
	text?: unknown;
}

/**
 * Dig the HTTP status out of an MCP error payload.
 *
 * The transport succeeded, so there is no status on the response itself — but the payload
 * carries one, and a caller cannot branch on 0. Both spellings and the wrapper keys the API
 * uses are checked.
 */
function statusOf(parsed: JsonObject): number {
	for (const candidate of [parsed, parsed.result, parsed.error, parsed.data]) {
		if (typeof candidate !== 'object' || candidate === null || Array.isArray(candidate)) {
			continue;
		}
		for (const key of ['status_code', 'statusCode']) {
			const status = (candidate as JsonObject)[key];
			if (typeof status === 'number' && Number.isInteger(status)) {
				return status;
			}
		}
	}
	return 0;
}

/**
 * Turn an MCP `tools/call` result into a plain object.
 *
 * Text parts are joined and parsed as JSON; a non-object is wrapped as `{ result }`. With no text
 * at all, `structuredContent` is used. Either way the result is returned as the server wrote it —
 * for an action tool that is `{ isError: false, result, defenderMetadata?, policyMetadata? }`.
 * Parts that are not text (images, embedded resources) are kept under `content_parts` rather than
 * silently dropped.
 *
 * @throws StackOneAPIError If the result carries `isError`. A failed tool call comes back as an
 *   ordinary response with that flag set, so without this check the error body would be handed
 *   to the caller as though it were a success.
 */
export function parseToolResult(result: Record<string, unknown>, name: string): JsonObject {
	const content = (Array.isArray(result.content) ? result.content : []) as ContentPart[];
	const texts = content.filter(
		(part): part is ContentPart & { text: string } =>
			part.type === 'text' && typeof part.text === 'string' && part.text !== '',
	);
	const nonText = content.filter((part) => !texts.includes(part as ContentPart & { text: string }));
	const payload = texts.map((part) => part.text).join('');

	let parsed: JsonObject = {};
	if (payload) {
		let loaded: unknown;
		try {
			loaded = JSON.parse(payload);
		} catch {
			loaded = payload;
		}
		parsed =
			typeof loaded === 'object' && loaded !== null && !Array.isArray(loaded)
				? (loaded as JsonObject)
				: { result: loaded as JsonObject[string] };
	} else if (typeof result.structuredContent === 'object' && result.structuredContent !== null) {
		parsed = result.structuredContent as JsonObject;
	}

	if (result.isError === true) {
		throw new StackOneAPIError(
			`Tool ${JSON.stringify(name)} failed: ${payload || JSON.stringify(parsed)}`,
			statusOf(parsed),
			parsed,
		);
	}

	// A copy, so content_parts below never writes into the caller's structuredContent.
	const returned = { ...parsed };
	if (nonText.length > 0) {
		returned.content_parts = nonText as unknown as JsonObject[];
	}
	return returned;
}

/**
 * Invoke a tool over MCP `tools/call`.
 */
export async function callMcpTool(
	request: McpRequest,
	name: string,
	args: JsonObject,
): Promise<JsonObject> {
	return withMcpSession(request, async (client) => {
		const result = await client.callTool({ name, arguments: args }, undefined, {
			timeout: request.timeout,
		});
		return parseToolResult(result as Record<string, unknown>, name);
	});
}
