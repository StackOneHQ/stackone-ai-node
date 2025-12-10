import { type StackOneHeaders, stackOneHeadersSchema } from '../schemas/headers';
import type { JsonDict } from '../types';

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
