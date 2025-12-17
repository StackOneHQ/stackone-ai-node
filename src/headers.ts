import { z } from 'zod/mini';
import type { JsonObject } from './types';

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
