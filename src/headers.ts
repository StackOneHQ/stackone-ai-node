import { z } from 'zod/v4-mini';
import type { JsonObject } from './types';
import { warn } from './utils/logger';

/**
 * Known StackOne API header keys that are forwarded as HTTP headers
 */
export const STACKONE_HEADER_KEYS = ['x-account-id'] as const;

/**
 * Zod schema for StackOne API headers (branded)
 * These headers are forwarded as HTTP headers in API requests
 */
export const stackOneHeadersSchema = z.record(z.string(), z.string()).brand<'StackOneHeaders'>();

/**
 * Branded type for StackOne API headers
 */
export type StackOneHeaders = z.infer<typeof stackOneHeadersSchema>;

/**
 * Normalizes header values from JsonObject to StackOneHeaders (branded type)
 * Converts numbers and booleans to strings, and serializes objects to JSON
 *
 * @param headers - Headers object with JSON value types
 * @returns Normalized headers with string values only (branded type)
 */
export function normalizeHeaders(headers: JsonObject | undefined): StackOneHeaders {
	if (!headers) return stackOneHeadersSchema.parse({});
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
	return stackOneHeadersSchema.parse(result);
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
 * are the same header to any server. The value check runs only for a declared header, which
 * is exactly where a model-supplied value needs it.
 */
export function sanitiseHeaders(
	supplied: JsonObject | undefined,
	allowed: ReadonlySet<string>,
): Record<string, string> {
	const clean: Record<string, string> = {};
	for (const [key, value] of Object.entries(normalizeHeaders(supplied))) {
		const name = key.trim();
		if (!allowed.has(name.toLowerCase())) {
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
