import { normalizeHeaders } from './headers';

describe('normalizeHeaders', () => {
	it('returns empty object for undefined input', () => {
		expect(normalizeHeaders(undefined)).toEqual({});
	});

	it('returns empty object for empty input', () => {
		expect(normalizeHeaders({})).toEqual({});
	});

	it('preserves string values', () => {
		expect(normalizeHeaders({ foo: 'bar', baz: 'qux' })).toEqual({
			foo: 'bar',
			baz: 'qux',
		});
	});

	it('converts numbers to strings', () => {
		expect(normalizeHeaders({ port: 8080, timeout: 30 })).toEqual({
			port: '8080',
			timeout: '30',
		});
	});

	it('converts booleans to strings', () => {
		expect(normalizeHeaders({ enabled: true, debug: false })).toEqual({
			enabled: 'true',
			debug: 'false',
		});
	});

	it('serializes objects to JSON', () => {
		expect(normalizeHeaders({ config: { key: 'value' } })).toEqual({
			config: '{"key":"value"}',
		});
	});

	it('serializes arrays to JSON', () => {
		expect(normalizeHeaders({ tags: ['foo', 'bar'] })).toEqual({
			tags: '["foo","bar"]',
		});
	});

	it('skips null values', () => {
		expect(normalizeHeaders({ foo: 'bar', baz: null })).toEqual({
			foo: 'bar',
		});
	});

	it('handles mixed value types', () => {
		expect(
			normalizeHeaders({
				string: 'text',
				number: 42,
				boolean: true,
				object: { nested: 'value' },
				array: [1, 2, 3],
				nullValue: null,
			}),
		).toEqual({
			string: 'text',
			number: '42',
			boolean: 'true',
			object: '{"nested":"value"}',
			array: '[1,2,3]',
		});
	});
});
