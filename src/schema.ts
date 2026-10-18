/**
 * The served tool schema, and the few provider-specific adjustments made on the way to a model.
 *
 * The guiding property: the schema a model is shown is the schema the MCP server served. Nothing
 * is invented and nothing is dropped, except where a provider's API would reject the request
 * outright — and those adjustments are made on a copy, per adapter, never on the tool itself.
 */
import type { JSONSchema, JsonSchemaProperties, ToolParameters } from './types';
import { setEntry } from './utils/set-entry';

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * A deep copy of a JSON value. Schemas are shared between the catalog cache and every tool built
 * from it, so anything handed to a caller must be a copy a caller cannot mutate back into the
 * cache.
 */
export function cloneJson<T>(value: T): T {
	return structuredClone(value);
}

/**
 * The served `required` list, if it is one: an array of strings. A string or null `required` is
 * malformed; treating it as a list would iterate characters or throw over one bad tool, so it is
 * read as "nothing required".
 */
function servedRequired(schema: Record<string, unknown>): string[] | undefined {
	const required = schema.required;
	if (!Array.isArray(required)) {
		return undefined;
	}
	const names = required.filter((name): name is string => typeof name === 'string');
	return names.length > 0 ? names : undefined;
}

/**
 * Build a tool's parameters from the `inputSchema` the MCP server served.
 *
 * The root is kept verbatim — `$schema`, `$defs`, `title`, `additionalProperties`, `oneOf` and
 * any keyword this SDK has never heard of — on a deep copy. `type` defaults to `object` when the
 * server omits it, and `required` is the served list (dropped when empty or malformed).
 */
export function toolParametersFromInputSchema(inputSchema: unknown): ToolParameters {
	const served = isPlainObject(inputSchema) ? cloneJson(inputSchema) : {};
	const { type, properties, required: _required, ...rest } = served;
	const parameters: ToolParameters = {
		...rest,
		type: typeof type === 'string' ? type : 'object',
		properties: (isPlainObject(properties) ? properties : {}) as JsonSchemaProperties,
	};
	const required = servedRequired(served);
	if (required) {
		parameters.required = required;
	}
	return parameters;
}

/**
 * Keywords the OpenAI and Anthropic tool APIs refuse at the root of a parameters schema. OpenAI
 * rejects all five ("schema must be a JSON Schema of type object and not have
 * oneOf/anyOf/allOf/enum/not at the top level"); Anthropic rejects the three combinators.
 */
const ROOT_KEYWORDS_PROVIDERS_REJECT = ['oneOf', 'anyOf', 'allOf', 'enum', 'not'] as const;

/**
 * Make a lossless schema acceptable to a provider that requires a plain object at the root.
 *
 * Top-level combinators are folded into the root rather than silently lost where that is
 * sound: every property any `allOf`/`oneOf`/`anyOf` branch declares becomes a root property
 * (the root's own definition wins), and an `allOf` branch's `required` is merged in, since all
 * of them must hold. A `oneOf`/`anyOf` branch's `required` is not — which alternative applies is
 * exactly what the flat root cannot say — so those fields stay optional and the server's own
 * validation decides. `enum` and `not` at the root cannot describe an object and are dropped.
 */
export function foldRootComposition(schema: JSONSchema): JSONSchema {
	if (!ROOT_KEYWORDS_PROVIDERS_REJECT.some((keyword) => keyword in schema)) {
		return schema;
	}
	const folded: JSONSchema = { ...schema };
	const properties: JsonSchemaProperties = { ...folded.properties };
	const required = new Set(folded.required ?? []);

	for (const keyword of ['allOf', 'oneOf', 'anyOf'] as const) {
		for (const branch of folded[keyword] ?? []) {
			if (!isPlainObject(branch)) {
				continue;
			}
			for (const [name, definition] of Object.entries(branch.properties ?? {})) {
				if (!Object.hasOwn(properties, name)) {
					setEntry(properties, name, definition);
				}
			}
			if (keyword === 'allOf') {
				for (const name of branch.required ?? []) {
					required.add(name);
				}
			}
		}
	}
	for (const keyword of ROOT_KEYWORDS_PROVIDERS_REJECT) {
		delete folded[keyword];
	}

	folded.type = 'object';
	folded.properties = properties;
	if (required.size > 0) {
		folded.required = [...required];
	} else {
		delete folded.required;
	}
	return folded;
}
