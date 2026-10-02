import { USER_AGENT } from './consts';
import type { JsonObject, JsonValue } from './types';
import { warn } from './utils/logger';
import { setEntry } from './utils/set-entry';

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
			setEntry(headers, name, value);
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
			setEntry(result, key, text);
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
	 * an open map, as on `*_execute_action`: `type: "object"` (or a type list that includes
	 * `"object"`, such as `["object", "null"]`), no `properties` key, and `additionalProperties`
	 * anything but `false`. A schema not typed as an object, or one that closes
	 * `additionalProperties` without listing `properties`, declares no names.
	 */
	nested: ReadonlySet<string> | 'any';
	/** The top-level `headers_<name>` properties, exactly as served. */
	flat: ReadonlySet<string>;
	/**
	 * Whether the served schema declares a top-level `headers` property as something other than an
	 * object — an ordinary field that happens to be named `headers`, not a header container. True
	 * when `type` is a non-`"object"` string, or an array of types that doesn't include `"object"`
	 * (e.g. `["string", "null"]`, or `[]`). A schema with no `headers` property, or one whose `type` is or
	 * includes `"object"`, is not ordinary: a non-object value sent for it is dropped rather than
	 * forwarded.
	 */
	ordinaryHeadersField: boolean;
}

/** The header arguments a served tool schema's `properties` declare. */
export function declaredHeaders(properties: Record<string, unknown>): DeclaredHeaders {
	const flat = new Set(
		Object.keys(properties).filter((name) => name.startsWith(FLAT_HEADER_PREFIX)),
	);
	const schema = properties.headers;
	if (!isPlainObject(schema)) {
		return { nested: new Set(), flat, ordinaryHeadersField: false };
	}
	const typed = typeof schema.type === 'string' || Array.isArray(schema.type);
	const objectTyped =
		schema.type === 'object' || (Array.isArray(schema.type) && schema.type.includes('object'));
	const ordinaryHeadersField = typed && !objectTyped;
	if (!('properties' in schema)) {
		const open = objectTyped && schema.additionalProperties !== false;
		return { nested: open ? 'any' : new Set(), flat, ordinaryHeadersField };
	}
	const nestedProperties = isPlainObject(schema.properties) ? schema.properties : {};
	return {
		nested: new Set(Object.keys(nestedProperties).map((name) => name.toLowerCase())),
		flat,
		ordinaryHeadersField,
	};
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
			warn(`Dropping header ${JSON.stringify(name)} from a tool call: ${reason}`);
			continue;
		}
		setEntry(clean, name, value);
	}
	return clean;
}

/**
 * Filter a tool call's header arguments to the ones its served schema declares.
 *
 * A header argument is an entry of a top-level `headers` object, or a top-level
 * `headers_<name>` argument. Every other argument is returned unchanged. A declared
 * `headers_<name>` keeps its value as given; nested entries are stringified.
 *
 * A top-level `headers` argument that isn't a plain object is forwarded unchanged when the
 * schema declares `headers` as something other than an object (it's an ordinary field that
 * happens to be named `headers`), and dropped otherwise. A flat `headers_<name>` whose value is
 * an array or object is dropped too — only a string, number or boolean can be a header value.
 */
export function sanitiseHeaderArguments(args: JsonObject, declared: DeclaredHeaders): JsonObject {
	const clean: JsonObject = {};
	for (const [key, value] of Object.entries(args)) {
		if (key === 'headers') {
			if (isPlainObject(value)) {
				clean.headers = sanitiseHeaders(value, declared.nested);
			} else if (declared.ordinaryHeadersField) {
				setEntry(clean, key, value);
			} else {
				warn(`Dropping header argument ${JSON.stringify(key)} from a tool call: not an object`);
			}
			continue;
		}
		if (!key.startsWith(FLAT_HEADER_PREFIX)) {
			setEntry(clean, key, value);
			continue;
		}
		if (isPlainObject(value) || Array.isArray(value)) {
			warn(
				`Dropping header argument ${JSON.stringify(key)} from a tool call: not a string, number or boolean`,
			);
			continue;
		}
		const text = headerText(value);
		if (text === undefined) {
			continue;
		}
		const reason = refuseHeader(key.slice(FLAT_HEADER_PREFIX.length), text, declared.flat.has(key));
		if (reason) {
			warn(`Dropping header argument ${JSON.stringify(key)} from a tool call: ${reason}`);
			continue;
		}
		setEntry(clean, key, value);
	}
	return clean;
}
