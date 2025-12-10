import { z } from 'zod/mini';
import type { JsonDict } from './types';

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
 * Normalises header values from JsonDict to StackOneHeaders (branded type)
 * Converts numbers and booleans to strings, and serialises objects to JSON
 *
 * @param headers - Headers object with unknown value types
 * @returns Normalised headers with string values only (branded type)
 */
export function normaliseHeaders(headers: JsonDict | undefined): StackOneHeaders {
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
