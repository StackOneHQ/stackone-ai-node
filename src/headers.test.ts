import {
	buildRequestHeaders,
	declaredHeaders,
	normalizeHeaders,
	sanitiseHeaderArguments,
	sanitiseHeaders,
} from './headers';
import type { JsonObject } from './types';

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

describe('declaredHeaders', () => {
	it('reads flat headers_* properties exactly as served, and nothing else', () => {
		expect(
			declaredHeaders({
				'headers_X-Trace': { type: 'string' },
				query_limit: { type: 'number' },
				body_headers_x: { type: 'string' },
			}),
		).toEqual({
			nested: new Set(),
			flat: new Set(['headers_X-Trace']),
			ordinaryHeadersField: false,
		});
	});

	it('reads the nested headers object, lower-cased', () => {
		expect(
			declaredHeaders({
				headers: { type: 'object', properties: { 'X-Trace': { type: 'string' } } },
				body: { type: 'object', properties: { 'x-other': { type: 'string' } } },
			}).nested,
		).toEqual(new Set(['x-trace']));
	});

	it('treats a headers object schema with no properties as declaring every name', () => {
		expect(declaredHeaders({ headers: { type: 'object' } }).nested).toBe('any');
	});

	it('treats an open object schema with additionalProperties as declaring every name', () => {
		expect(
			declaredHeaders({ headers: { type: 'object', additionalProperties: true } }).nested,
		).toBe('any');
		expect(
			declaredHeaders({
				headers: { type: 'object', additionalProperties: { type: 'string' } },
			}).nested,
		).toBe('any');
	});

	it('treats additionalProperties: false with no properties as declaring nothing', () => {
		expect(
			declaredHeaders({ headers: { type: 'object', additionalProperties: false } }).nested,
		).toEqual(new Set());
	});

	it('treats a headers schema without type: "object" as declaring nothing', () => {
		expect(declaredHeaders({ headers: {} }).nested).toEqual(new Set());
		expect(declaredHeaders({ headers: { additionalProperties: true } }).nested).toEqual(new Set());
		expect(declaredHeaders({ headers: { type: 'string' } }).nested).toEqual(new Set());
	});

	it('treats empty properties as declaring nothing', () => {
		expect(declaredHeaders({ headers: { type: 'object', properties: {} } }).nested).toEqual(
			new Set(),
		);
	});
});

describe('sanitiseHeaders', () => {
	const allowed = new Set(['x-trace']);

	beforeEach(() => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});
	});
	afterEach(() => {
		vi.restoreAllMocks();
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

	it('forwards any name under an open schema, except the ones the SDK owns', () => {
		expect(
			sanitiseHeaders(
				{ 'x-custom': 'a', Authorization: 'x', 'X-Account-Id': 'b', 'user-agent': 'c' },
				'any',
			),
		).toEqual({ 'x-custom': 'a' });
	});

	it('says why each header was dropped', () => {
		sanitiseHeaders({ Authorization: 'x', 'x-other': 'y', 'X-Trace': 'bad\n' }, allowed);
		expect(vi.mocked(console.warn).mock.calls.map(([message]) => message)).toEqual([
			'[@stackone/ai] Dropping header "Authorization" from a tool call: set by the SDK',
			'[@stackone/ai] Dropping header "x-other" from a tool call: not declared by the schema',
			'[@stackone/ai] Dropping header "X-Trace" from a tool call: malformed',
		]);
	});
});

describe('sanitiseHeaderArguments', () => {
	const declared = declaredHeaders({
		'headers_x-trace': { type: 'string' },
		'headers_x-account-id': { type: 'string' },
		headers: { type: 'object', properties: { 'x-nested': { type: 'string' } } },
	});

	beforeEach(() => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('forwards a declared headers_* argument with its value as given', () => {
		expect(sanitiseHeaderArguments({ 'headers_x-trace': 7 }, declared)).toEqual({
			'headers_x-trace': 7,
		});
	});

	it('drops an undeclared headers_* argument', () => {
		expect(sanitiseHeaderArguments({ headers_foo: 'bar' }, declared)).toEqual({});
		expect(console.warn).toHaveBeenCalledWith(
			'[@stackone/ai] Dropping header argument "headers_foo" from a tool call: not declared by the schema',
		);
	});

	it('drops an SDK-owned headers_* argument even when declared', () => {
		expect(sanitiseHeaderArguments({ 'headers_x-account-id': 'victim' }, declared)).toEqual({});
		expect(console.warn).toHaveBeenCalledWith(
			'[@stackone/ai] Dropping header argument "headers_x-account-id" from a tool call: set by the SDK',
		);
	});

	it('filters the nested headers object against its own declared names', () => {
		expect(
			sanitiseHeaderArguments({ headers: { 'x-nested': 'a', 'x-trace': 'b' } }, declared),
		).toEqual({ headers: { 'x-nested': 'a' } });
	});

	it('passes every other argument through unchanged', () => {
		const args = {
			query_limit: 1,
			body: { headers: { Authorization: 'kept' }, headers_x: 'kept' },
			path_id: 'x',
			session_id: 's',
		};
		expect(sanitiseHeaderArguments(args, declared)).toEqual(args);
		expect(console.warn).not.toHaveBeenCalled();
	});

	it('drops a string headers argument when headers is declared as an object', () => {
		expect(sanitiseHeaderArguments({ headers: 'not an object' }, declared)).toEqual({});
		expect(console.warn).toHaveBeenCalledWith(
			'[@stackone/ai] Dropping header argument "headers" from a tool call: not an object',
		);
	});

	it('drops an array headers argument when headers is declared as an object', () => {
		expect(sanitiseHeaderArguments({ headers: [['x-account-id', 'B']] }, declared)).toEqual({});
		expect(console.warn).toHaveBeenCalledWith(
			'[@stackone/ai] Dropping header argument "headers" from a tool call: not an object',
		);
	});

	it('drops a non-object headers argument when no headers property is declared at all', () => {
		const noHeadersSchema = declaredHeaders({ 'headers_x-trace': { type: 'string' } });
		expect(sanitiseHeaderArguments({ headers: 'x-account-id: B' }, noHeadersSchema)).toEqual({});
		expect(console.warn).toHaveBeenCalledWith(
			'[@stackone/ai] Dropping header argument "headers" from a tool call: not an object',
		);
	});

	it('forwards a string headers argument unchanged when headers is declared as a string field', () => {
		const stringHeadersSchema = declaredHeaders({ headers: { type: 'string' } });
		expect(sanitiseHeaderArguments({ headers: 'x-account-id: B' }, stringHeadersSchema)).toEqual({
			headers: 'x-account-id: B',
		});
		expect(console.warn).not.toHaveBeenCalled();
	});

	it('drops an array value on a declared flat headers_<name> argument', () => {
		expect(
			sanitiseHeaderArguments({ 'headers_x-trace': ['a\r\nx-account-id: B'] }, declared),
		).toEqual({});
		expect(console.warn).toHaveBeenCalledWith(
			'[@stackone/ai] Dropping header argument "headers_x-trace" from a tool call: not a string, number or boolean',
		);
	});

	it('drops an object value on a declared flat headers_<name> argument', () => {
		expect(sanitiseHeaderArguments({ 'headers_x-trace': { nested: 'value' } }, declared)).toEqual(
			{},
		);
		expect(console.warn).toHaveBeenCalledWith(
			'[@stackone/ai] Dropping header argument "headers_x-trace" from a tool call: not a string, number or boolean',
		);
	});

	it('still drops a null flat headers_<name> argument silently', () => {
		expect(sanitiseHeaderArguments({ 'headers_x-trace': null }, declared)).toEqual({});
		expect(console.warn).not.toHaveBeenCalled();
	});
});

// Assigning to `__proto__` sets the prototype, so each of these once dropped the entry.
describe('an entry named __proto__', () => {
	const withProto = (rest: string) => JSON.parse(`{"__proto__":"p",${rest}}`) as JsonObject;

	it('is kept as an own key by sanitiseHeaderArguments', () => {
		const clean = sanitiseHeaderArguments(withProto('"constructor":"c","q":1'), {
			nested: new Set(),
			flat: new Set(),
			ordinaryHeadersField: false,
		});
		expect(Object.entries(clean)).toEqual([
			['__proto__', 'p'],
			['constructor', 'c'],
			['q', 1],
		]);
		expect(JSON.stringify(clean)).toBe('{"__proto__":"p","constructor":"c","q":1}');
	});

	it('is kept by normalizeHeaders and an open sanitiseHeaders', () => {
		expect(Object.entries(normalizeHeaders(withProto('"x":1')))).toEqual([
			['__proto__', 'p'],
			['x', '1'],
		]);
		expect(Object.entries(sanitiseHeaders(withProto('"x":"1"'), 'any'))).toEqual([
			['__proto__', 'p'],
			['x', '1'],
		]);
	});

	it('is kept by buildRequestHeaders', () => {
		const headers = buildRequestHeaders({
			apiKey: 'k',
			extraHeaders: JSON.parse('{"__proto__":"p"}') as Record<string, string>,
		});
		expect(Object.hasOwn(headers, '__proto__')).toBe(true);
		expect(Object.getPrototypeOf(headers)).toBe(Object.prototype);
	});
});
