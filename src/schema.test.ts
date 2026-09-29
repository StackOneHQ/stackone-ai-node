import { foldRootComposition, toolParametersFromInputSchema } from './schema';
import type { JSONSchema } from './types';

describe('toolParametersFromInputSchema', () => {
	it('keeps every root keyword verbatim', () => {
		const served = {
			$schema: 'https://json-schema.org/draft/2020-12/schema',
			title: 'Probe',
			type: 'object',
			additionalProperties: false,
			$defs: { Money: { type: 'object', properties: { amount: { type: 'number' } } } },
			oneOf: [{ required: ['a'] }, { required: ['b'] }],
			'x-vendor': { anything: true },
			properties: { a: { type: 'string' }, b: { $ref: '#/$defs/Money' } },
			required: ['a'],
		};

		expect(toolParametersFromInputSchema(served)).toEqual(served);
	});

	it('copies rather than aliases the served schema', () => {
		const served = { type: 'object', properties: { a: { type: 'object', properties: {} } } };
		const parameters = toolParametersFromInputSchema(served);

		const nested = parameters.properties.a?.properties;
		assert(nested);
		(nested as Record<string, unknown>).injected = { type: 'string' };

		expect(served.properties.a.properties).toEqual({});
	});

	it('defaults a missing type and properties', () => {
		expect(toolParametersFromInputSchema({})).toEqual({ type: 'object', properties: {} });
		expect(toolParametersFromInputSchema(undefined)).toEqual({ type: 'object', properties: {} });
	});

	it.each([['a string'], [null], [[]], [[1, 2]]])(
		'drops a malformed required of %j',
		(required) => {
			expect(
				toolParametersFromInputSchema({ type: 'object', properties: { a: {} }, required }),
			).not.toHaveProperty('required');
		},
	);

	// The SDK needs no per-property marker: requiredness stays where the server put it, so a
	// property literally named `nullable`, and a served `nullable` keyword, are both untouched.
	it('never touches a property or keyword named nullable', () => {
		const served = {
			type: 'object',
			properties: {
				nullable: { type: 'object', properties: { name: { type: 'string' } }, nullable: false },
				other: { type: 'string', nullable: true },
			},
			required: ['nullable'],
		};

		expect(toolParametersFromInputSchema(served)).toEqual(served);
	});
});

describe('foldRootComposition', () => {
	it('leaves a schema without root combinators untouched', () => {
		const schema: JSONSchema = { type: 'object', properties: { a: { type: 'string' } } };
		expect(foldRootComposition(schema)).toBe(schema);
	});

	it('drops a root oneOf, keeping every branch property optional', () => {
		const folded = foldRootComposition({
			type: 'object',
			properties: { id: { type: 'string' } },
			oneOf: [
				{ required: ['id'] },
				{ properties: { email: { type: 'string', format: 'email' } }, required: ['email'] },
			],
			required: ['kind'],
		});

		expect(folded).toEqual({
			type: 'object',
			properties: { id: { type: 'string' }, email: { type: 'string', format: 'email' } },
			required: ['kind'],
		});
	});

	it('merges an allOf into the root, required included, root definitions winning', () => {
		expect(
			foldRootComposition({
				type: 'object',
				properties: { a: { type: 'string', description: 'root' } },
				allOf: [
					{ properties: { a: { type: 'number' }, b: { type: 'number' } }, required: ['b'] },
					{ required: ['a'] },
				],
			}),
		).toEqual({
			type: 'object',
			properties: { a: { type: 'string', description: 'root' }, b: { type: 'number' } },
			required: ['b', 'a'],
		});
	});

	it('drops root anyOf, enum and not, and keeps everything else', () => {
		expect(
			foldRootComposition({
				$schema: 'https://json-schema.org/draft/2020-12/schema',
				title: 'T',
				$defs: { X: { type: 'string' } },
				additionalProperties: false,
				properties: { x: { $ref: '#/$defs/X' } },
				anyOf: [{ required: ['x'] }],
				enum: [{}],
				not: { required: ['y'] },
			}),
		).toEqual({
			$schema: 'https://json-schema.org/draft/2020-12/schema',
			title: 'T',
			$defs: { X: { type: 'string' } },
			additionalProperties: false,
			type: 'object',
			properties: { x: { $ref: '#/$defs/X' } },
		});
	});

	it('does not mutate its input', () => {
		const schema: JSONSchema = { type: 'object', properties: {}, oneOf: [{ required: ['a'] }] };
		foldRootComposition(schema);
		expect(schema.oneOf).toEqual([{ required: ['a'] }]);
	});
});
