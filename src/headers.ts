import { USER_AGENT } from './consts';
import type { JsonObject, JsonValue } from './types';
import { warn } from './utils/logger';

/**
 * Header names the SDK owns. They are applied after every other header is merged, so neither a
 * tool call nor a caller-supplied `headers` option can replace the credential or retarget the
 * request at another account.
 */
const SDK_OWNED_HEADERS = ['authorization', 'x-account-id', 'user-agent'] as const;

const isPlainObject = (value: unknown): value is JsonObject =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

/** Whether a caller-supplied header name is one the SDK owns and will override. */
export function isSdkOwnedHeader(name: string): boolean {
	return (SDK_OWNED_HEADERS as readonly string[]).includes(name.trim().toLowerCase());
}

/**
 * HTTP Basic credentials for an API key, as every StackOne endpoint expects them.
 */
function buildAuthHeader(apiKey: string): string {
	return `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`;
}

/**
 * The HTTP headers for a request to StackOne: the caller's extra headers first, then the SDK's
 * own, so `Authorization`, `x-account-id` and `User-Agent` are always the SDK's.
 *
 * Case variants of the owned names are removed before they are set — `fetch` joins
 * `authorization` and `Authorization` into one comma-separated value rather than letting either
 * win. With no `accountId`, no `x-account-id` is sent at all.
 */
export function buildRequestHeaders(options: {
	apiKey: string;
	accountId?: string;
	extraHeaders?: Record<string, string>;
}): Record<string, string> {
	const headers: Record<string, string> = {};
	for (const [name, value] of Object.entries(options.extraHeaders ?? {})) {
		if (!isSdkOwnedHeader(name)) {
			headers[name] = value;
		}
	}
	headers['User-Agent'] = USER_AGENT;
	headers.Authorization = buildAuthHeader(options.apiKey);
	if (options.accountId) {
		headers['x-account-id'] = options.accountId;
	}
	return headers;
}

/** A header value as a string: scalars stringified, objects serialised, null as absent. */
function headerText(value: JsonValue | undefined): string | undefined {
	switch (true) {
		case value == null:
			return undefined;
		case typeof value === 'string':
			return value;
		case typeof value === 'number' || typeof value === 'boolean':
			return String(value);
		default:
			return JSON.stringify(value);
	}
}

/**
 * Normalizes header values from JsonObject to strings.
 * Converts numbers and booleans to strings, serializes objects to JSON and skips nulls.
 *
 * @param headers - Headers object with JSON value types
 * @returns Normalized headers with string values only
 */
export function normalizeHeaders(headers: JsonObject | undefined): Record<string, string> {
	const result: Record<string, string> = {};
	for (const [key, value] of Object.entries(headers ?? {})) {
		const text = headerText(value);
		if (text !== undefined) {
			result[key] = text;
		}
	}
	return result;
}

/** An RFC 9110 header field name (`token`). */
const HEADER_NAME_PATTERN = /^[A-Za-z0-9!#$%&'*+.^_`|~-]+$/;

/**
 * A header field value: visible ASCII, space, tab and obs-text. Excludes CR and LF, so a value
 * cannot smuggle a second header line. Anchored with `^…$` and no `m` flag, so a trailing
 * newline cannot slip past the way it does under Python's `re.match(…$)`.
 */
const HEADER_VALUE_PATTERN = /^[\x20-\x7e\t\x80-\xff]*$/;

const FLAT_HEADER_PREFIX = 'headers_';

/**
 * The header arguments a served tool schema declares.
 *
 * The schema itself is the allowlist, in whichever param-style the server served it. Nothing
 * needs maintaining in the SDK: an action that starts declaring a header works without a release.
 */
export interface DeclaredHeaders {
	/**
	 * Names declared under the nested `headers` object, lower-cased, or `'any'` when `headers` is
	 * an open map, as on `*_execute_action`: `type: "object"`, no `properties` key, and
	 * `additionalProperties` anything but `false`. A schema without `type: "object"`, or one that
	 * closes `additionalProperties` without listing `properties`, declares no names.
	 */
	nested: ReadonlySet<string> | 'any';
	/** The top-level `headers_<name>` properties, exactly as served. */
	flat: ReadonlySet<string>;
}

/** The header arguments a served tool schema's `properties` declare. */
export function declaredHeaders(properties: Record<string, unknown>): DeclaredHeaders {
	const flat = new Set(
		Object.keys(properties).filter((name) => name.startsWith(FLAT_HEADER_PREFIX)),
	);
	const schema = properties.headers;
	if (!isPlainObject(schema)) {
		return { nested: new Set(), flat };
	}
	if (!('properties' in schema)) {
		const open = schema.type === 'object' && schema.additionalProperties !== false;
		return { nested: open ? 'any' : new Set(), flat };
	}
	const nestedProperties = isPlainObject(schema.properties) ? schema.properties : {};
	return { nested: new Set(Object.keys(nestedProperties).map((name) => name.toLowerCase())), flat };
}

/**
 * Why a header argument must not be forwarded, or `undefined` if it may be.
 *
 * `Authorization`, `x-account-id` and `User-Agent` are refused even when declared, because the
 * SDK sets them itself. The value check runs only for a declared header, which is exactly where
 * a model-supplied value needs it.
 */
function refuseHeader(name: string, value: string, declared: boolean): string | undefined {
	if (isSdkOwnedHeader(name)) {
		return 'set by the SDK';
	}
	if (!declared) {
		return 'not declared by the schema';
	}
	if (!HEADER_NAME_PATTERN.test(name) || !HEADER_VALUE_PATTERN.test(value)) {
		return 'malformed';
	}
	return undefined;
}

/**
 * Keep only the entries of a nested `headers` argument the served schema declared, and only with
 * well-formed values.
 *
 * An allowlist, not a denylist. Tool arguments are model-controlled, so a prompt-injected call
 * reaches this object directly — and a denylist has to enumerate every synonym of "credential"
 * and "tenant selector" (`Proxy-Authorization`, `x-stackone-account-id`, `Cookie`,
 * `X-Api-Key`, …) and is wrong the moment one is missed.
 *
 * Names are compared trimmed and case-insensitively: `" x-account-id "` and `"X-ACCOUNT-ID"`
 * are the same header to any server.
 */
export function sanitiseHeaders(
	supplied: JsonObject | undefined,
	allowed: ReadonlySet<string> | 'any',
): Record<string, string> {
	const clean: Record<string, string> = {};
	for (const [key, value] of Object.entries(normalizeHeaders(supplied))) {
		const name = key.trim();
		const declared = allowed === 'any' || allowed.has(name.toLowerCase());
		const reason = refuseHeader(name, value, declared);
		if (reason) {
			warn(`Dropping header "${name}" from a tool call: ${reason}`);
			continue;
		}
		clean[name] = value;
	}
	return clean;
}

/**
 * Filter a tool call's header arguments to the ones its served schema declares.
 *
 * A header argument is an entry of a top-level `headers` object, or a top-level
 * `headers_<name>` argument. Every other argument is returned unchanged. A declared
 * `headers_<name>` keeps its value as given; nested entries are stringified.
 */
export function sanitiseHeaderArguments(args: JsonObject, declared: DeclaredHeaders): JsonObject {
	const clean: JsonObject = {};
	for (const [key, value] of Object.entries(args)) {
		if (key === 'headers' && isPlainObject(value)) {
			clean.headers = sanitiseHeaders(value, declared.nested);
			continue;
		}
		if (!key.startsWith(FLAT_HEADER_PREFIX)) {
			clean[key] = value;
			continue;
		}
		const text = headerText(value);
		if (text === undefined) {
			continue;
		}
		const reason = refuseHeader(key.slice(FLAT_HEADER_PREFIX.length), text, declared.flat.has(key));
		if (reason) {
			warn(`Dropping header argument "${key}" from a tool call: ${reason}`);
			continue;
		}
		clean[key] = value;
	}
	return clean;
}
