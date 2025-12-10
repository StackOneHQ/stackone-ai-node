import { describe, expect, it } from 'vitest';
import { normaliseHeaders } from './headers';

describe('normaliseHeaders', () => {
	it('returns empty object for undefined input', () => {
		expect(normaliseHeaders(undefined)).toEqual({});
	});

	it('returns empty object for empty input', () => {
		expect(normaliseHeaders({})).toEqual({});
	});

	it('preserves string values', () => {
		expect(normaliseHeaders({ foo: 'bar', baz: 'qux' })).toEqual({
			foo: 'bar',
			baz: 'qux',
		});
	});

	it('converts numbers to strings', () => {
		expect(normaliseHeaders({ port: 8080, timeout: 30 })).toEqual({
			port: '8080',
			timeout: '30',
		});
	});

	it('converts booleans to strings', () => {
		expect(normaliseHeaders({ enabled: true, debug: false })).toEqual({
			enabled: 'true',
			debug: 'false',
		});
	});

	it('serialises objects to JSON', () => {
		expect(normaliseHeaders({ config: { key: 'value' } })).toEqual({
			config: '{"key":"value"}',
		});
	});

	it('serialises arrays to JSON', () => {
		expect(normaliseHeaders({ tags: ['foo', 'bar'] })).toEqual({
			tags: '["foo","bar"]',
		});
	});

	it('skips undefined values', () => {
		expect(normaliseHeaders({ foo: 'bar', baz: undefined })).toEqual({
			foo: 'bar',
		});
	});

	it('skips null values', () => {
		expect(normaliseHeaders({ foo: 'bar', baz: null })).toEqual({
			foo: 'bar',
		});
	});

	it('handles mixed value types', () => {
		expect(
			normaliseHeaders({
				string: 'text',
				number: 42,
				boolean: true,
				object: { nested: 'value' },
				array: [1, 2, 3],
				nullValue: null,
				undefinedValue: undefined,
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
