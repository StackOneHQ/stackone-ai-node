/**
 * Utility to convert JSON Schema to Zod schemas at runtime.
 * This is used for Claude Agent SDK integration which requires Zod schemas.
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
		const zodType = convertPropertyToZod(zodLib, propSchema as JSONSchema, isRequired);
		zodSchema[key] = zodType;
	}

	return { zodLib, zodSchema };
}

/**
 * Convert a single JSON Schema property to a Zod type.
 */
function convertPropertyToZod(
	zodLib: typeof z,
	schema: JSONSchema,
	isRequired: boolean,
): ZodTypeAny {
	let zodType: ZodTypeAny;

	// Handle type-based conversion
	const schemaType = Array.isArray(schema.type) ? schema.type[0] : schema.type;

	switch (schemaType) {
		case 'string':
			zodType = createStringSchema(zodLib, schema);
			break;
		case 'number':
		case 'integer':
			zodType = createNumberSchema(zodLib, schema);
			break;
		case 'boolean':
			zodType = zodLib.boolean();
			break;
		case 'array':
			zodType = createArraySchema(zodLib, schema);
			break;
		case 'object':
			zodType = createObjectSchema(zodLib, schema);
			break;
		case 'null':
			zodType = zodLib.null();
			break;
		default:
			// For unknown types or union types, use unknown
			zodType = zodLib.unknown();
	}

	// Add description if present
	if (schema.description) {
		zodType = zodType.describe(schema.description);
	}

	// Make optional if not required
	if (!isRequired) {
		zodType = zodType.optional();
	}

	return zodType;
}

/**
 * Create a Zod string schema with constraints.
 */
function createStringSchema(zodLib: typeof z, schema: JSONSchema): ZodTypeAny {
	let stringSchema = zodLib.string();

	// Handle enum values
	if (schema.enum && schema.enum.length > 0) {
		const enumValues = schema.enum.filter((v): v is string => typeof v === 'string');
		if (enumValues.length > 0) {
			return zodLib.enum(enumValues as [string, ...string[]]);
		}
	}

	// Handle format
	if (schema.format === 'email') {
		stringSchema = stringSchema.email();
	} else if (schema.format === 'url' || schema.format === 'uri') {
		stringSchema = stringSchema.url();
	} else if (schema.format === 'uuid') {
		stringSchema = stringSchema.uuid();
	} else if (schema.format === 'date-time') {
		stringSchema = stringSchema.datetime();
	}

	// Handle length constraints
	if (typeof schema.minLength === 'number') {
		stringSchema = stringSchema.min(schema.minLength);
	}
	if (typeof schema.maxLength === 'number') {
		stringSchema = stringSchema.max(schema.maxLength);
	}

	// Handle pattern
	if (schema.pattern) {
		stringSchema = stringSchema.regex(new RegExp(schema.pattern));
	}

	return stringSchema;
}

/**
 * Create a Zod number schema with constraints.
 */
function createNumberSchema(zodLib: typeof z, schema: JSONSchema): ZodTypeAny {
	let numberSchema = zodLib.number();

	// Handle enum values
	if (schema.enum && schema.enum.length > 0) {
		const enumValues = schema.enum.filter((v): v is number => typeof v === 'number');
		if (enumValues.length > 0) {
			return zodLib.enum(enumValues.map(String) as [string, ...string[]]).transform(Number);
		}
	}

	// Handle range constraints
	if (typeof schema.minimum === 'number') {
		numberSchema = numberSchema.min(schema.minimum);
	}
	if (typeof schema.maximum === 'number') {
		numberSchema = numberSchema.max(schema.maximum);
	}
	if (typeof schema.exclusiveMinimum === 'number') {
		numberSchema = numberSchema.gt(schema.exclusiveMinimum);
	}
	if (typeof schema.exclusiveMaximum === 'number') {
		numberSchema = numberSchema.lt(schema.exclusiveMaximum);
	}

	// Handle integer type
	if (schema.type === 'integer') {
		numberSchema = numberSchema.int();
	}

	return numberSchema;
}

/**
 * Create a Zod array schema.
 */
function createArraySchema(zodLib: typeof z, schema: JSONSchema): ZodTypeAny {
	let itemSchema: ZodTypeAny = zodLib.unknown();

	if (schema.items && !Array.isArray(schema.items)) {
		itemSchema = convertPropertyToZod(zodLib, schema.items as JSONSchema, true);
	}

	let arraySchema = zodLib.array(itemSchema);

	// Handle length constraints
	if (typeof schema.minItems === 'number') {
		arraySchema = arraySchema.min(schema.minItems);
	}
	if (typeof schema.maxItems === 'number') {
		arraySchema = arraySchema.max(schema.maxItems);
	}

	return arraySchema;
}

/**
 * Create a Zod object schema.
 */
function createObjectSchema(zodLib: typeof z, schema: JSONSchema): ZodTypeAny {
	if (!schema.properties) {
		// Object with no defined properties - use record with string keys
		return zodLib.record(zodLib.string(), zodLib.unknown());
	}

	const required = schema.required ?? [];
	const shape: Record<string, ZodTypeAny> = {};

	for (const [key, propSchema] of Object.entries(schema.properties)) {
		const isRequired = required.includes(key);
		shape[key] = convertPropertyToZod(zodLib, propSchema as JSONSchema, isRequired);
	}

	return zodLib.object(shape);
}
