import { declaredHeaderNames, normalizeHeaders, sanitiseHeaders } from './headers';

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

describe('sanitiseHeaders', () => {
	const allowed = declaredHeaderNames(['headers_x-trace', 'query_limit', 'body_headers_x']);

	beforeEach(() => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('builds the allowlist from headers_* properties only, lower-cased', () => {
		expect(declaredHeaderNames(['headers_X-Trace', 'query_limit', 'body_headers_x'])).toEqual(
			new Set(['x-trace']),
		);
	});

	it('drops every header the served schema does not declare', () => {
		expect(
			sanitiseHeaders(
				{
					Authorization: 'Bearer stolen',
					'Proxy-Authorization': 'Basic stolen',
					'x-account-id': 'victim',
					'x-stackone-account-id': 'victim',
					Cookie: 'session=x',
					'X-Api-Key': 'stolen',
				},
				allowed,
			),
		).toEqual({});
	});

	it.each([' x-trace', 'X-TRACE\t', 'X-Trace'])(
		'matches %j case- and whitespace-insensitively',
		(name) => {
			expect(sanitiseHeaders({ [name]: 'abc' }, allowed)).toEqual({ [name.trim()]: 'abc' });
		},
	);

	it.each(['a\r\nEvil: 1', 'trailing\n', 'bad\rvalue', 'nul\u0000byte', 'wide\u0100char'])(
		'drops a declared header whose value is %j',
		(value) => {
			expect(sanitiseHeaders({ 'X-Trace': value }, allowed)).toEqual({});
		},
	);

	it('stringifies scalar values and skips nulls', () => {
		expect(sanitiseHeaders({ 'x-trace': 42 }, allowed)).toEqual({ 'x-trace': '42' });
		expect(sanitiseHeaders({ 'x-trace': null }, allowed)).toEqual({});
	});

	it('warns once per dropped header', () => {
		sanitiseHeaders({ Authorization: 'x', 'X-Trace': 'bad\n' }, allowed);
		expect(console.warn).toHaveBeenCalledTimes(2);
	});
});
