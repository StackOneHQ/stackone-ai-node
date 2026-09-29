import { StackOneError } from './utils/error-stackone';
import { warn } from './utils/logger';
import type { JsonObject, JsonValue } from './types';

/** Matches a flat_prefixed envelope key: `<location>_<field>` (e.g. `path_id`, `query_limit`). */
const FLAT_ENVELOPE_KEY_PATTERN = /^(path|query|body|headers)_(.+)$/;

const ENVELOPE_LOCATIONS = ['path', 'query', 'headers', 'body'] as const;

type EnvelopeLocation = (typeof ENVELOPE_LOCATIONS)[number];

/** The four buckets of an `/actions/rpc` request. */
type Envelope = Record<EnvelopeLocation, JsonObject>;

const isEnvelopeLocation = (key: string): key is EnvelopeLocation =>
	(ENVELOPE_LOCATIONS as readonly string[]).includes(key);

const isPlainObject = (value: unknown): value is JsonObject =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Whether a tool's arguments should be read as flat_prefixed, decided ONCE from its served
 * schema rather than per key.
 *
 * Under flat_prefixed every parameter is prefixed, so `path_to_file` means `path.to_file`; under
 * a bare schema it is a body field that merely starts with "path_". ALL declared keys must be
 * prefixed, not any: one bare name is proof the schema is not flat_prefixed, and `any` would be
 * satisfied by the very key this exists to protect. No declared keys means no schema to
 * consult, so every match is trusted — otherwise every path parameter would fall into the body.
 */
export function isFlatPrefixedSchema(declared: ReadonlySet<string>): boolean {
	return declared.size === 0 || [...declared].every((key) => FLAT_ENVELOPE_KEY_PATTERN.test(key));
}

/**
 * Split tool arguments into the RPC envelope (path/query/headers/body).
 *
 * Tools are listed with `?param-style=flat_prefixed`, so keys arrive as `<location>_<field>`
 * and the prefix carries the location. A bare object-valued `path`/`query`/`headers`/`body` key
 * is still bucketed for clients holding a nested schema, and any other key falls through to the
 * body.
 *
 * Precedence is a property of the KIND of key, never of the caller's key order: flat_prefixed
 * beats nested beats bare. The Python SDK applies the same rules, so both send byte-identical
 * wire bodies for the same call.
 *
 * Buckets are null-prototype objects, so fields named after `Object.prototype` members
 * (`constructor`, `toString`, `__proto__`) are ordinary data rather than prototype lookups.
 *
 * @param params The model-supplied arguments.
 * @param declared The served schema's property names.
 * @param flatPrefixed The result of {@link isFlatPrefixedSchema} for `declared`.
 * @throws StackOneError When a reserved container key carries a non-object value.
 */
export function splitEnvelopeParams(
	params: JsonObject,
	declared: ReadonlySet<string>,
	flatPrefixed: boolean = isFlatPrefixedSchema(declared),
): Envelope {
	const buckets: Envelope = {
		path: Object.create(null) as JsonObject,
		query: Object.create(null) as JsonObject,
		headers: Object.create(null) as JsonObject,
		body: Object.create(null) as JsonObject,
	};
	const setDefault = (bucket: JsonObject, field: string, value: JsonValue): void => {
		if (!Object.hasOwn(bucket, field)) {
			bucket[field] = value;
		}
	};

	const nested: Array<[EnvelopeLocation, JsonObject]> = [];
	const bare: Array<[string, JsonValue]> = [];
	for (const [key, value] of Object.entries(params)) {
		const match = flatPrefixed ? FLAT_ENVELOPE_KEY_PATTERN.exec(key) : null;
		if (match) {
			buckets[match[1] as EnvelopeLocation][match[2] as string] = value;
			continue;
		}
		// A reserved word the schema declares as a property is a field, not a container —
		// refusing it would reject a schema-valid call.
		if (isEnvelopeLocation(key) && !declared.has(key)) {
			// A container given a scalar is malformed input, not a body field. Putting it in the
			// body would smuggle a field literally named `path` into the payload.
			if (!isPlainObject(value)) {
				throw new StackOneError(
					`"${key}" is an envelope container and must be an object, got ${value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value}. Did you mean ${key}_<field>?`,
				);
			}
			nested.push([key, value]);
			continue;
		}
		bare.push([key, value]);
	}

	for (const [location, value] of nested) {
		for (const [field, fieldValue] of Object.entries(value)) {
			setDefault(buckets[location], field, fieldValue);
		}
	}
	for (const [key, value] of bare) {
		setDefault(buckets.body, key, value);
	}

	// Spread onto ordinary objects so downstream JSON and schema handling sees plain records.
	return {
		path: { ...buckets.path },
		query: { ...buckets.query },
		headers: { ...buckets.headers },
		body: { ...buckets.body },
	};
}

/**
 * Warn, once, that a schema with bare names has flat-prefix detection disabled. Called by the
 * tool the first time it splits arguments, rather than per call or per listing.
 */
export function warnBareSchema(toolName: string): void {
	warn(
		`Tool "${toolName}" has bare parameter names in its schema; flat-prefix detection is disabled and prefixed arguments may fall into the body.`,
	);
}
