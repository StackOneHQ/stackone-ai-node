import { USER_AGENT } from './consts';
import type { JsonObject } from './types';
import { warn } from './utils/logger';

/**
 * Header names the SDK owns. They are applied after every other header is merged, so neither a
 * tool call nor a caller-supplied `headers` option can replace the credential or retarget the
 * request at another account.
 */
const SDK_OWNED_HEADERS = ['authorization', 'x-account-id', 'user-agent'] as const;

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

/**
 * Normalizes header values from JsonObject to strings.
 * Converts numbers and booleans to strings, serializes objects to JSON and skips nulls.
 *
 * @param headers - Headers object with JSON value types
 * @returns Normalized headers with string values only
 */
export function normalizeHeaders(headers: JsonObject | undefined): Record<string, string> {
	if (!headers) {
		return {};
	}
	const result: Record<string, string> = {};
	for (const [key, value] of Object.entries(headers)) {
		switch (true) {
			case value == null:
				continue;
			case typeof value === 'string':
				result[key] = value;
				break;
			case typeof value === 'number' || typeof value === 'boolean':
				result[key] = String(value);
				break;
			default:
				result[key] = JSON.stringify(value);
				break;
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

const DECLARED_HEADER_PREFIX = 'headers_';

/**
 * The header names a served tool schema declares, lower-cased.
 *
 * Under `param-style=flat_prefixed` a header parameter is served as a `headers_<name>`
 * property, so the schema itself is the allowlist. Nothing needs maintaining in the SDK: an
 * action that starts declaring a header works without a release.
 */
export function declaredHeaderNames(propertyNames: Iterable<string>): Set<string> {
	const allowed = new Set<string>();
	for (const name of propertyNames) {
		if (name.startsWith(DECLARED_HEADER_PREFIX)) {
			allowed.add(name.slice(DECLARED_HEADER_PREFIX.length).toLowerCase());
		}
	}
	return allowed;
}

/**
 * Keep only the headers the served schema declared, and only with well-formed values.
 *
 * An allowlist, not a denylist. Tool arguments are model-controlled, so a prompt-injected call
 * reaches this object directly — and a denylist has to enumerate every synonym of "credential"
 * and "tenant selector" (`Proxy-Authorization`, `x-stackone-account-id`, `Cookie`,
 * `X-Api-Key`, …) and is wrong the moment one is missed.
 *
 * Names are compared trimmed and case-insensitively: `" x-account-id "` and `"X-ACCOUNT-ID"`
 * are the same header to any server. `Authorization`, `x-account-id` and `User-Agent` are
 * refused even when declared, because the SDK sets them itself. The value check runs only for a declared header, which
 * is exactly where a model-supplied value needs it.
 */
export function sanitiseHeaders(
	supplied: JsonObject | undefined,
	allowed: ReadonlySet<string>,
): Record<string, string> {
	const clean: Record<string, string> = {};
	for (const [key, value] of Object.entries(normalizeHeaders(supplied))) {
		const name = key.trim();
		// Owned names are refused even when declared: the SDK sets them itself, afterwards.
		if (!allowed.has(name.toLowerCase()) || isSdkOwnedHeader(name)) {
			warn(`Dropping header "${name}" from a tool call: no served schema declares it`);
			continue;
		}
		if (!HEADER_NAME_PATTERN.test(name) || !HEADER_VALUE_PATTERN.test(value)) {
			warn(`Dropping malformed header "${name}" from a tool call`);
			continue;
		}
		clean[name] = value;
	}
	return clean;
}
