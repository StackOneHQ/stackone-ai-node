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

// The shared vectors (src/vectors.test.ts) grade which headers each served schema declares,
// and what sanitiseHeaderArguments forwards and warns; these test the pieces directly.
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

describe('buildRequestHeaders with an end user', () => {
	it('sets x-end-user-id last, replacing every case variant the caller sent', () => {
		expect(
			buildRequestHeaders({
				apiKey: 'k',
				accountId: 'acc1',
				endUserId: 'alice',
				extraHeaders: { 'X-End-User-Id': 'mallory', ' x-end-user-id ': 'eve', 'x-trace': 't' },
			}),
		).toEqual({
			'x-trace': 't',
			'User-Agent': expect.any(String),
			Authorization: 'Basic azo=',
			'x-account-id': 'acc1',
			'x-end-user-id': 'alice',
		});
	});

	it("passes the caller's x-end-user-id through when there is no end user", () => {
		expect(
			buildRequestHeaders({ apiKey: 'k', extraHeaders: { 'X-End-User-Id': 'carol' } }),
		).toMatchObject({ 'X-End-User-Id': 'carol' });
	});
});
