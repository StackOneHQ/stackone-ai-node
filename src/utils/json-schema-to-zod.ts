/**
 * Utility to convert JSON Schema to Zod schemas at runtime.
 * This is used for Claude Agent SDK integration which requires Zod schemas.
 *
 * Uses Zod's native z.fromJSONSchema() method available in Zod v4.3+.
 */

import type { z, ZodTypeAny } from 'zod';
import type { JSONSchema } from '../types';
import { peerDependencies } from '../../package.json';
import { tryImport } from './try-import';

/**
 * Convert a JSON Schema to a Zod schema object.
 * Returns a record of Zod types that can be used with the Claude Agent SDK tool() function.
 *
 * @param schema - JSON Schema object with properties
 * @returns Promise resolving to a record of Zod types compatible with Claude Agent SDK
 */
export async function jsonSchemaToZod(
	schema: JSONSchema,
): Promise<{ zodLib: typeof z; zodSchema: Record<string, ZodTypeAny> }> {
	const zodLib = await tryImport<typeof import('zod')>(
		'zod',
		`npm install zod (requires ${peerDependencies.zod})`,
	);

	const properties = schema.properties ?? {};
	const required = schema.required ?? [];

	const zodSchema: Record<string, ZodTypeAny> = {};

	for (const [key, propSchema] of Object.entries(properties)) {
		const isRequired = required.includes(key);
		// Use Zod's native fromJSONSchema() to convert each property
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- JSON Schema type compatibility
		let zodType = zodLib.fromJSONSchema(propSchema as any);

		// Make optional if not required
		if (!isRequired) {
			zodType = zodType.optional();
		}

		zodSchema[key] = zodType;
	}

	return { zodLib, zodSchema };
}
