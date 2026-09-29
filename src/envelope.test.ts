import { isFlatPrefixedSchema, splitEnvelopeParams } from './envelope';

const split = (params: Record<string, unknown>, declared: string[] = []) =>
	splitEnvelopeParams(params as never, new Set(declared));

describe('splitEnvelopeParams', () => {
	it('buckets flat_prefixed keys by their location prefix', () => {
		expect(
			split({ path_id: '123', query_limit: 10, 'headers_x-custom': 'value', body_name: 'test' }),
		).toEqual({
			path: { id: '123' },
			query: { limit: 10 },
			headers: { 'x-custom': 'value' },
			body: { name: 'test' },
		});
	});

	it('accepts nested envelopes and sends unprefixed keys to the body', () => {
		expect(split({ body: { nested: 'value' }, path: { id: '1' }, extra: 'x' })).toEqual({
			path: { id: '1' },
			query: {},
			headers: {},
			body: { nested: 'value', extra: 'x' },
		});
	});

	// The prefix pattern alone cannot tell a path param from a body field that happens to start
	// with "path_". The served schema settles it — decided once, from ALL of its keys.
	describe('is decided once from the served schema', () => {
		it('keeps prefix lookalikes in the body when any declared key is bare', () => {
			const result = split({ path_to_file: '/tmp/x' }, ['path_to_file', 'name']);
			expect(result.body).toEqual({ path_to_file: '/tmp/x' });
			expect(result.path).toEqual({});
		});

		it('splits every match, declared or not, when every declared key is prefixed', () => {
			const result = split({ path_id: '1', query_offset: 10 }, ['path_id', 'query_limit']);
			expect(result.path).toEqual({ id: '1' });
			// Undeclared but prefixed: the model may be working from a newer schema than the
			// cached listing. Routing it to the body would silently drop the argument.
			expect(result.query).toEqual({ offset: 10 });
		});

		it('trusts every match when there is no schema to consult', () => {
			expect(split({ path_to_file: '/tmp/x' }).path).toEqual({ to_file: '/tmp/x' });
			expect(isFlatPrefixedSchema(new Set())).toBe(true);
		});

		it('is disabled by a single bare name', () => {
			expect(isFlatPrefixedSchema(new Set(['path_id', 'name']))).toBe(false);
			expect(isFlatPrefixedSchema(new Set(['path_id', 'body_name']))).toBe(true);
		});
	});

	it('treats a declared reserved word as a field, not a container', () => {
		expect(split({ query: 'sales' }, ['query', 'id']).body).toEqual({ query: 'sales' });
	});

	it.each([['not-an-object'], [5], [null], [['a']]])(
		'rejects a reserved container given %j rather than smuggling it into the body',
		(value) => {
			expect(() => split({ query: value })).toThrow(/envelope container and must be an object/);
		},
	);

	it('does not depend on the caller key order: flat beats nested beats bare', () => {
		expect(split({ body_foo: 1, foo: 2 }).body).toEqual({ foo: 1 });
		expect(split({ foo: 2, body_foo: 1 }).body).toEqual({ foo: 1 });

		expect(split({ body: { foo: 9 }, foo: 2 }).body).toEqual({ foo: 9 });
		expect(split({ foo: 2, body: { foo: 9 } }).body).toEqual({ foo: 9 });

		expect(split({ path: { id: 'nested' }, path_id: 'flat' }).path).toEqual({ id: 'flat' });
		expect(split({ path_id: 'flat', path: { id: 'nested' } }).path).toEqual({ id: 'flat' });
	});

	it('keeps fields named after Object.prototype members as plain data', () => {
		const result = split(
			JSON.parse(
				'{"body_constructor":"x","path_toString":"y","query_valueOf":"z","body___proto__":"p","hasOwnProperty":"h"}',
			) as Record<string, unknown>,
		);

		expect(JSON.stringify(result.body)).toBe(
			'{"constructor":"x","__proto__":"p","hasOwnProperty":"h"}',
		);
		expect(result.path).toEqual({ toString: 'y' });
		expect(result.query).toEqual({ valueOf: 'z' });
		expect(Object.getPrototypeOf(result.body)).toBe(Object.prototype);
	});
});
