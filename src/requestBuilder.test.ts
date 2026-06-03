import { fc, test as fcTest } from '@fast-check/vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/node';
import { type HttpExecuteConfig, type JsonObject, ParameterLocation } from './types';
import { StackOneAPIError } from './utils/error-stackone-api';
import { RequestBuilder } from './requestBuilder';

describe('RequestBuilder', () => {
	let builder: RequestBuilder;
	const recordRequests = () => {
		const recordedRequests: Request[] = [];
		const listener = ({ request }: { request: Request }) => {
			recordedRequests.push(request);
		};
		server.events.on('request:start', listener);
		return recordedRequests;
	};
	const mockConfig = {
		kind: 'http',
		method: 'GET',
		url: 'https://api.example.com/test/{pathParam}',
		bodyType: 'json',
		params: [
			{ name: 'pathParam', location: ParameterLocation.PATH, type: 'string' },
			{ name: 'queryParam', location: ParameterLocation.QUERY, type: 'string' },
			{ name: 'headerParam', location: ParameterLocation.HEADER, type: 'string' },
			{ name: 'bodyParam', location: ParameterLocation.BODY, type: 'string' },
			{ name: 'defaultParam', location: ParameterLocation.BODY, type: 'string' },
			{ name: 'filter', location: ParameterLocation.QUERY, type: 'object' },
			{ name: 'proxy', location: ParameterLocation.QUERY, type: 'object' },
			{ name: 'regularObject', location: ParameterLocation.QUERY, type: 'object' },
			{ name: 'simple', location: ParameterLocation.QUERY, type: 'string' },
			{ name: 'simpleString', location: ParameterLocation.QUERY, type: 'string' },
			{ name: 'simpleNumber', location: ParameterLocation.QUERY, type: 'number' },
			{ name: 'simpleBoolean', location: ParameterLocation.QUERY, type: 'boolean' },
			{ name: 'complexObject', location: ParameterLocation.QUERY, type: 'object' },
			{ name: 'deepFilter', location: ParameterLocation.QUERY, type: 'object' },
			{ name: 'emptyFilter', location: ParameterLocation.QUERY, type: 'object' },
		],
	} satisfies HttpExecuteConfig;

	beforeEach(() => {
		builder = new RequestBuilder(mockConfig, { 'Initial-Header': 'test' });
		server.use(
			http.get('https://api.example.com/test/:pathParam', ({ params, request }) => {
				const url = new URL(request.url);
				const queryParam = url.searchParams.get('queryParam');

				if (params.pathParam === 'invalid') {
					return HttpResponse.json({ error: 'Not found' }, { status: 404 });
				}

				return HttpResponse.json({
					success: true,
					pathParam: params.pathParam,
					queryParam,
				});
			}),
		);
	});

	afterEach(() => {
		server.events.removeAllListeners('request:start');
	});

	it('should initialize with headers from constructor', () => {
		expect(builder.getHeaders()).toEqual({ 'Initial-Header': 'test' });
	});

	it('should set and get headers', () => {
		builder.setHeaders({ 'New-Header': 'value' });
		expect(builder.getHeaders()).toEqual({
			'Initial-Header': 'test',
			'New-Header': 'value',
		});
	});

	it('should prepare headers', () => {
		builder.setHeaders({ 'Custom-Header': 'value' });
		const headers = builder.prepareHeaders();

		expect(headers).toEqual({
			'User-Agent': 'stackone-ai-node',
			'Initial-Header': 'test',
			'Custom-Header': 'value',
		});
	});

	it('should prepare request parameters correctly', () => {
		const params = {
			pathParam: 'path-value',
			queryParam: 'query-value',
			headerParam: 'header-value',
			bodyParam: 'body-value',
			defaultParam: 'default-value',
		};

		const [url, bodyParams, queryParams] = builder.prepareRequestParams(params);

		expect(url).toBe('https://api.example.com/test/path-value');
		expect(queryParams).toEqual({ queryParam: 'query-value' });
		expect(bodyParams).toEqual({
			bodyParam: 'body-value',
			defaultParam: 'default-value',
		});
		expect(builder.getHeaders()).toEqual({
			'Initial-Header': 'test',
			headerParam: 'header-value',
		});
	});

	it('should build fetch options for JSON body type', () => {
		const bodyParams = { test: 'value' };
		const options = builder.buildFetchOptions(bodyParams);

		expect(options.method).toBe('GET');
		expect(options.headers).toHaveProperty('Content-Type', 'application/json');
		expect(options.body).toBe(JSON.stringify(bodyParams));
	});

	it('should build fetch options for form body type', () => {
		const formBuilder = new RequestBuilder({
			...mockConfig,
			bodyType: 'form',
		});

		const bodyParams = { test: 'value' };
		const options = formBuilder.buildFetchOptions(bodyParams);

		expect(options.headers).toHaveProperty('Content-Type', 'application/x-www-form-urlencoded');
		expect(options.body).toBe('test=value');
	});

	it('should build fetch options for multipart-form body type', () => {
		const formBuilder = new RequestBuilder({
			...mockConfig,
			bodyType: 'multipart-form',
		});

		const bodyParams = { test: 'value' };
		const options = formBuilder.buildFetchOptions(bodyParams);

		expect(options.body).toBeInstanceOf(FormData);
	});

	it('should execute a request successfully', async () => {
		const params = {
			pathParam: 'path-value',
			queryParam: 'query-value',
		};

		const recordedRequests = recordRequests();

		const result = await builder.execute(params);

		expect(result).toEqual({ success: true, pathParam: 'path-value', queryParam: 'query-value' });
		expect(recordedRequests).toHaveLength(1);
		expect(recordedRequests[0]?.url).toBe(
			'https://api.example.com/test/path-value?queryParam=query-value',
		);
	});

	it('should return request details on dry run', async () => {
		const params = { pathParam: 'path-value' };

		const recordedRequests = recordRequests();

		const result = await builder.execute(params, { dryRun: true });

		expect(result).toEqual({
			url: 'https://api.example.com/test/path-value',
			method: 'GET',
			headers: {
				'User-Agent': 'stackone-ai-node',
				'Initial-Header': 'test',
			},
			body: null,
			mappedParams: params,
		});
		expect(recordedRequests).toHaveLength(0);
	});

	it('should throw StackOneAPIError when API request fails', async () => {
		const params = { pathParam: 'invalid' };
		const recordedRequests = recordRequests();

		await expect(builder.execute(params)).rejects.toThrow(StackOneAPIError);
		expect(recordedRequests).toHaveLength(1);
		expect(recordedRequests[0]?.url).toBe('https://api.example.com/test/invalid');
	});

	it('should serialize deep object query parameters correctly', async () => {
		const params = {
			pathParam: 'test-value',
			filter: {
				updated_after: '2020-01-01T00:00:00.000Z',
				job_id: '123',
				nested: {
					level2: 'value',
					level3: {
						deep: 'nested-value',
					},
				},
			},
			proxy: {
				custom_field: 'custom-value',
				sort: 'first_name',
			},
			simple: 'simple-value',
		};

		const result = await builder.execute(params, { dryRun: true });
		const url = new URL(result.url as string);

		// Check that deep object parameters are serialized correctly
		expect(url.searchParams.get('filter[updated_after]')).toBe('2020-01-01T00:00:00.000Z');
		expect(url.searchParams.get('filter[job_id]')).toBe('123');
		expect(url.searchParams.get('filter[nested][level2]')).toBe('value');
		expect(url.searchParams.get('filter[nested][level3][deep]')).toBe('nested-value');
		expect(url.searchParams.get('proxy[custom_field]')).toBe('custom-value');
		expect(url.searchParams.get('proxy[sort]')).toBe('first_name');

		// Check that simple parameters are still handled normally
		expect(url.searchParams.get('simple')).toBe('simple-value');

		// Ensure the original filter/proxy objects are not added as strings
		expect(url.searchParams.get('filter')).toBeNull();
		expect(url.searchParams.get('proxy')).toBeNull();
	});

	it('should handle null values in deep objects', async () => {
		const params = {
			pathParam: 'test-value',
			filter: {
				valid_field: 'value',
				null_field: null,
				empty_string: '',
				zero: 0,
				false_value: false,
			},
		};

		const result = await builder.execute(params, { dryRun: true });
		const url = new URL(result.url as string);

		// Check that valid values are included
		expect(url.searchParams.get('filter[valid_field]')).toBe('value');
		expect(url.searchParams.get('filter[empty_string]')).toBe('');
		expect(url.searchParams.get('filter[zero]')).toBe('0');
		expect(url.searchParams.get('filter[false_value]')).toBe('false');

		// Check that null values are excluded
		expect(url.searchParams.get('filter[null_field]')).toBeNull();
	});

	it('should apply deep object serialization to all object parameters', async () => {
		const params = {
			pathParam: 'test-value',
			regularObject: {
				nested: 'value',
				deepNested: {
					level2: 'deep-value',
				},
			},
		};

		const result = await builder.execute(params, { dryRun: true });
		const url = new URL(result.url as string);

		// All objects should now be serialized using deep object notation
		expect(url.searchParams.get('regularObject[nested]')).toBe('value');
		expect(url.searchParams.get('regularObject[deepNested][level2]')).toBe('deep-value');

		// The original object parameter should not be present as a string
		expect(url.searchParams.get('regularObject')).toBeNull();
	});

	it('should handle mixed parameter types with deep object serialization', async () => {
		const params = {
			pathParam: 'test-value',
			simpleString: 'simple-value',
			simpleNumber: 42,
			simpleBoolean: true,
			complexObject: {
				nested: 'nested-value',
				array: [1, 2, 3], // Arrays should be converted to string
				nestedObject: {
					deep: 'deep-value',
				},
			},
		};

		const result = await builder.execute(params, { dryRun: true });
		const url = new URL(result.url as string);

		// Primitive values should be handled normally
		expect(url.searchParams.get('simpleString')).toBe('simple-value');
		expect(url.searchParams.get('simpleNumber')).toBe('42');
		expect(url.searchParams.get('simpleBoolean')).toBe('true');

		// Complex object should use deep object serialization
		expect(url.searchParams.get('complexObject[nested]')).toBe('nested-value');
		expect(url.searchParams.get('complexObject[array]')).toBe('[1,2,3]'); // Arrays become JSON strings
		expect(url.searchParams.get('complexObject[nestedObject][deep]')).toBe('deep-value');

		// Original complex object should not be present
		expect(url.searchParams.get('complexObject')).toBeNull();
	});

	describe('Security and Performance Improvements', () => {
		it('should throw error when circular reference is detected', async () => {
			// Test runtime behavior when circular reference is passed
			// Note: This tests error handling for malformed input at runtime
			const inner: Record<string, unknown> = { b: 'test' };
			const circular: Record<string, unknown> = { a: inner };
			inner.circular = circular; // Create circular reference

			const params = {
				pathParam: 'test-value',
				filter: circular,
			} as unknown as JsonObject; // Cast to test runtime error handling

			await expect(builder.execute(params, { dryRun: true })).rejects.toThrow(
				'Circular reference detected in parameter object',
			);
		});

		it('should handle special types correctly at runtime', async () => {
			// Test runtime behavior when non-JSON types are passed
			// Note: Date and RegExp are not valid JsonValue types, but we test
			// the serialiser's runtime handling of these edge cases
			const testDate = new Date('2023-01-01T00:00:00.000Z');
			const testRegex = /test-pattern/gi;

			const params = {
				pathParam: 'test-value',
				filter: {
					dateField: testDate,
					regexField: testRegex,
					nullField: null,
					emptyString: '',
				},
			} as unknown as JsonObject; // Cast to test runtime serialization

			const result = await builder.execute(params, { dryRun: true });
			const url = new URL(result.url as string);

			// Date should be serialized to ISO string
			expect(url.searchParams.get('filter[dateField]')).toBe('2023-01-01T00:00:00.000Z');

			// RegExp should be serialized to string representation
			expect(url.searchParams.get('filter[regexField]')).toBe('/test-pattern/gi');

			// Null should be filtered out
			expect(url.searchParams.get('filter[nullField]')).toBeNull();

			// Empty string should be preserved
			expect(url.searchParams.get('filter[emptyString]')).toBe('');
		});

		it('should throw error when trying to serialize functions at runtime', async () => {
			// Test runtime error handling when functions are passed
			const params = {
				pathParam: 'test-value',
				filter: {
					validField: 'test',
					functionField: () => 'test', // Functions should not be serializable
				},
			} as unknown as JsonObject; // Cast to test runtime error handling

			await expect(builder.execute(params, { dryRun: true })).rejects.toThrow(
				'Functions cannot be serialized as parameters',
			);
		});

		it('should handle empty objects correctly', async () => {
			const params = {
				pathParam: 'test-value',
				emptyFilter: {},
				filter: {
					validField: 'test',
					emptyNested: {},
				},
			};

			const result = await builder.execute(params, { dryRun: true });
			const url = new URL(result.url as string);

			// Empty objects should not create any parameters
			expect(url.searchParams.get('emptyFilter')).toBeNull();
			expect(url.searchParams.get('filter[emptyNested]')).toBeNull();

			// Valid fields should still work
			expect(url.searchParams.get('filter[validField]')).toBe('test');
		});

		it('should handle arrays correctly within objects', async () => {
			const params = {
				pathParam: 'test-value',
				filter: {
					arrayField: [1, 2, 3],
					stringArray: ['a', 'b', 'c'],
					mixed: ['string', 42, true],
				},
			};

			const result = await builder.execute(params, { dryRun: true });
			const url = new URL(result.url as string);

			// Arrays should be converted to JSON strings
			expect(url.searchParams.get('filter[arrayField]')).toBe('[1,2,3]');
			expect(url.searchParams.get('filter[stringArray]')).toBe('["a","b","c"]');
			expect(url.searchParams.get('filter[mixed]')).toBe('["string",42,true]');
		});

		it('should handle nested objects with special types at runtime', async () => {
			// Test runtime serialization of nested non-JSON types
			const params = {
				pathParam: 'test-value',
				filter: {
					nested: {
						dateField: new Date('2023-01-01T00:00:00.000Z'),
						level2: {
							regexField: /test/,
							stringField: 'normal-string',
						},
					},
				},
			} as unknown as JsonObject; // Cast to test runtime serialization

			const result = await builder.execute(params, { dryRun: true });
			const url = new URL(result.url as string);

			expect(url.searchParams.get('filter[nested][dateField]')).toBe('2023-01-01T00:00:00.000Z');
			expect(url.searchParams.get('filter[nested][level2][regexField]')).toBe('/test/');
			expect(url.searchParams.get('filter[nested][level2][stringField]')).toBe('normal-string');
		});

		it('should maintain performance with large objects', async () => {
			// Create a moderately large object to test performance optimizations
			const largeFilter: Record<string, string | { subField1: string; subField2: string }> = {};
			for (let i = 0; i < 100; i++) {
				largeFilter[`field_${i}`] = `value_${i}`;
				if (i % 10 === 0) {
					largeFilter[`nested_${i}`] = {
						subField1: `sub_value_${i}_1`,
						subField2: `sub_value_${i}_2`,
					};
				}
			}

			const params = {
				pathParam: 'test-value',
				filter: largeFilter,
			} satisfies JsonObject;

			const startTime = performance.now();
			const result = await builder.execute(params, { dryRun: true });
			const endTime = performance.now();

			// Should complete in reasonable time (less than 100ms for this size)
			expect(endTime - startTime).toBeLessThan(100);

			const url = new URL(result.url as string);

			// Verify some parameters are correctly serialized
			expect(url.searchParams.get('filter[field_0]')).toBe('value_0');
			expect(url.searchParams.get('filter[field_99]')).toBe('value_99');
			expect(url.searchParams.get('filter[nested_0][subField1]')).toBe('sub_value_0_1');
		});

		it('should allow the same object in different branches after circular check', async () => {
			const sharedObject = { shared: 'value' };
			const params = {
				pathParam: 'test-value',
				filter: {
					branch1: {
						shared: sharedObject,
					},
					branch2: {
						shared: sharedObject, // Same object reference in different branch - should be allowed
					},
				},
			};

			const result = await builder.execute(params, { dryRun: true });
			const url = new URL(result.url as string);

			// Both branches should be serialized correctly
			expect(url.searchParams.get('filter[branch1][shared][shared]')).toBe('value');
			expect(url.searchParams.get('filter[branch2][shared][shared]')).toBe('value');
		});
	});
});

/**
 * Property-Based Tests for RequestBuilder
 *
 * These tests verify invariants that must hold for ANY valid input,
 * replacing/supplementing example-based tests:
 *
 * Parameter Key Validation (replaces "should validate parameter keys and reject invalid characters"):
 *   - Valid: "user_id", "filter.name", "x-custom-field" => accepted
 *   - Invalid: "invalid key with spaces", "key@special!" => throws "Invalid parameter key"
 *
 * Value Serialization (supplements "should handle arrays correctly within objects" - kept for clarity):
 *   - { arrayField: [1, 2, 3] } => filter[arrayField]="[1,2,3]"
 *   - { stringArray: ["a", "b"] } => filter[stringArray]='["a","b"]'
 *
 * Deep Object Nesting (replaces "should throw error when recursion depth limit is exceeded"):
 *   - { nested: { nested: { value: "ok" } } } (depth 3) => accepted
 *   - { nested: { nested: { ... 12 levels ... } } } => throws "Maximum nesting depth (10) exceeded"
 */
describe('RequestBuilder - Property-Based Tests', () => {
	const baseConfig = {
		kind: 'http',
		method: 'GET',
		url: 'https://api.example.com/test',
		bodyType: 'json',
		params: [{ name: 'filter', location: ParameterLocation.QUERY, type: 'object' }],
	} satisfies HttpExecuteConfig;

	// Arbitrary for valid parameter keys (alphanumeric, underscore, dot, hyphen)
	const validKeyArbitrary = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9_.-]{0,19}$/);

	// Arbitrary for invalid parameter keys (contains spaces or special chars)
	const invalidKeyArbitrary = fc
		.string({ minLength: 1, maxLength: 20 })
		.filter((s) => /[^a-zA-Z0-9_.-]/.test(s) && s.trim().length > 0);

	/**
	 * Parameter Key Validation
	 *
	 * Examples of valid keys: "user_id", "filter.name", "X-Custom-Header"
	 * Examples of invalid keys: "invalid key", "special@char", "has spaces"
	 */
	describe('Parameter Key Validation', () => {
		// Example: { filter: { user_id: "123" } } => ?filter[user_id]=123 (no error)
		fcTest.prop([validKeyArbitrary, fc.string()], { numRuns: 100 })(
			'accepts valid parameter keys',
			async (key, value) => {
				const builder = new RequestBuilder(baseConfig);
				const params = {
					filter: { [key]: value },
				};

				// Should not throw for valid keys
				const result = await builder.execute(params, { dryRun: true });
				expect(result.url).toBeDefined();
			},
		);

		// Example: { filter: { "invalid key with spaces": "test" } } => throws Error
		fcTest.prop([invalidKeyArbitrary, fc.string()], { numRuns: 100 })(
			'rejects invalid parameter keys',
			async (key, value) => {
				const builder = new RequestBuilder(baseConfig);
				const params = {
					filter: { [key]: value },
				};

				await expect(builder.execute(params, { dryRun: true })).rejects.toThrow(
					/Invalid parameter key/,
				);
			},
		);
	});

	/**
	 * Header Management
	 *
	 * Examples:
	 * - new RequestBuilder(config, { "Auth": "token" }).setHeaders({ "X-Api": "key" })
	 *   => getHeaders() returns { "Auth": "token", "X-Api": "key" }
	 * - prepareHeaders() always includes "User-Agent: stackone-ai-node"
	 */
	describe('Header Management', () => {
		// Arbitrary for header key-value pairs
		const headerArbitrary = fc.dictionary(
			fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9-]{0,29}$/),
			fc.string({ minLength: 1, maxLength: 100 }),
			{ minKeys: 1, maxKeys: 5 },
		);

		// Example: init with {"A": "1"}, setHeaders({"B": "2"}) => {"A": "1", "B": "2"}
		fcTest.prop([headerArbitrary, headerArbitrary], { numRuns: 50 })(
			'setHeaders accumulates headers without losing existing ones',
			(headers1, headers2) => {
				const builder = new RequestBuilder(baseConfig, headers1);
				builder.setHeaders(headers2);

				const result = builder.getHeaders();

				// All headers from both sets should be present (with headers2 overriding duplicates)
				for (const [key, value] of Object.entries(headers2)) {
					expect(result[key]).toBe(value);
				}
				for (const [key, value] of Object.entries(headers1)) {
					if (!(key in headers2)) {
						expect(result[key]).toBe(value);
					}
				}
			},
		);

		// Example: prepareHeaders() => { "User-Agent": "stackone-ai-node", ...customHeaders }
		fcTest.prop([headerArbitrary], { numRuns: 50 })(
			'prepareHeaders always includes User-Agent',
			(headers) => {
				const builder = new RequestBuilder(baseConfig, headers);
				const prepared = builder.prepareHeaders();

				expect(prepared['User-Agent']).toBe('stackone-ai-node');
			},
		);

		// Example: const h = getHeaders(); h["X"] = "Y"; getHeaders()["X"] is still undefined
		fcTest.prop([headerArbitrary], { numRuns: 50 })(
			'getHeaders returns a copy, not the original',
			(headers) => {
				const builder = new RequestBuilder(baseConfig, headers);
				const retrieved = builder.getHeaders();

				// Mutating the returned object should not affect internal state
				retrieved['Mutated-Header'] = 'mutated';

				expect(builder.getHeaders()['Mutated-Header']).toBeUndefined();
			},
		);
	});

	/**
	 * Value Serialization
	 *
	 * Examples:
	 * - { key: "hello" } => ?filter[key]=hello
	 * - { key: 42 } => ?filter[key]=42
	 * - { key: true } => ?filter[key]=true
	 * - { key: [1, 2, 3] } => ?filter[key]=[1,2,3]
	 * - { key: ["a", "b"] } => ?filter[key]=["a","b"]
	 */
	describe('Value Serialization', () => {
		// Example: { filter: { key: "hello world" } } => ?filter[key]=hello%20world
		fcTest.prop([fc.string()], { numRuns: 100 })(
			'string values serialize to themselves',
			async (str) => {
				const builder = new RequestBuilder(baseConfig);
				const params = { filter: { key: str } };

				const result = await builder.execute(params, { dryRun: true });
				const url = new URL(result.url as string);

				expect(url.searchParams.get('filter[key]')).toBe(str);
			},
		);

		// Example: { filter: { key: 42 } } => ?filter[key]=42
		fcTest.prop([fc.integer()], { numRuns: 100 })(
			'integer values serialize to string',
			async (num) => {
				const builder = new RequestBuilder(baseConfig);
				const params = { filter: { key: num } };

				const result = await builder.execute(params, { dryRun: true });
				const url = new URL(result.url as string);

				expect(url.searchParams.get('filter[key]')).toBe(String(num));
			},
		);

		// Example: { filter: { key: true } } => ?filter[key]=true
		fcTest.prop([fc.boolean()], { numRuns: 10 })(
			'boolean values serialize to string',
			async (bool) => {
				const builder = new RequestBuilder(baseConfig);
				const params = { filter: { key: bool } };

				const result = await builder.execute(params, { dryRun: true });
				const url = new URL(result.url as string);

				expect(url.searchParams.get('filter[key]')).toBe(String(bool));
			},
		);

		// Example: { filter: { key: [1, 2, 3] } } => ?filter[key]=[1,2,3]
		// Example: { filter: { key: ["a", "b"] } } => ?filter[key]=["a","b"]
		fcTest.prop(
			[fc.array(fc.oneof(fc.string(), fc.integer(), fc.boolean()), { minLength: 1, maxLength: 5 })],
			{
				numRuns: 50,
			},
		)('arrays serialize to JSON string', async (arr) => {
			const builder = new RequestBuilder(baseConfig);
			const params = { filter: { key: arr } };

			const result = await builder.execute(params, { dryRun: true });
			const url = new URL(result.url as string);

			expect(url.searchParams.get('filter[key]')).toBe(JSON.stringify(arr));
		});
	});

	/**
	 * Deep Object Nesting
	 *
	 * Examples:
	 * - { nested: { value: "ok" } } (depth 2) => accepted
	 * - { a: { b: { c: { d: { e: { f: { g: { h: { i: { j: { k: "too deep" } } } } } } } } } } }
	 *   (depth 11) => throws "Maximum nesting depth (10) exceeded"
	 */
	describe('Deep Object Nesting', () => {
		// Example: depth 5 => { nested: { nested: { nested: { nested: { nested: { value: "test" } } } } } }
		fcTest.prop([fc.integer({ min: 1, max: 9 })], { numRuns: 20 })(
			'accepts objects within depth limit',
			async (depth) => {
				const builder = new RequestBuilder(baseConfig);
				const deepObject = {};
				let current: Record<string, unknown> = deepObject;
				for (let i = 0; i < depth; i++) {
					current.nested = {};
					current = current.nested as Record<string, unknown>;
				}
				current.value = 'test';

				const params = { filter: deepObject } as JsonObject;
				const result = await builder.execute(params, { dryRun: true });

				expect(result.url).toBeDefined();
			},
		);

		// Example: 12 levels of nesting => throws error
		test('rejects objects exceeding depth limit of 10', async () => {
			const builder = new RequestBuilder(baseConfig);
			let deepObject: Record<string, unknown> = { value: 'test' };
			for (let i = 0; i < 12; i++) {
				deepObject = { nested: deepObject };
			}

			const params = { filter: deepObject } as JsonObject;

			await expect(builder.execute(params, { dryRun: true })).rejects.toThrow(
				/Maximum nesting depth.*exceeded/,
			);
		});
	});

	/**
	 * Body Type Handling
	 *
	 * Examples:
	 * - bodyType: "json" => Content-Type: application/json, body: '{"test":"value"}'
	 * - bodyType: "form" => Content-Type: application/x-www-form-urlencoded, body: "test=value"
	 * - bodyType: "multipart-form" => body is FormData instance
	 */
	describe('Body Type Handling', () => {
		const bodyTypes = ['json', 'form', 'multipart-form'] as const;

		// Example: buildFetchOptions({ test: "value" }) with bodyType "json" => valid options
		fcTest.prop(
			[
				fc.constantFrom(...bodyTypes),
				fc.dictionary(fc.string(), fc.string(), { minKeys: 1, maxKeys: 3 }),
			],
			{
				numRuns: 30,
			},
		)('all valid body types produce valid fetch options', (bodyType, bodyParams) => {
			const config = { ...baseConfig, bodyType };
			const builder = new RequestBuilder(config);

			const options = builder.buildFetchOptions(bodyParams);

			expect(options.method).toBe('GET');
			expect(options.body).toBeDefined();
		});
	});
});

/**
 * Binary file downloads
 *
 * File-download actions (e.g. googledrive_unified_download_file) serve raw binary with
 * the file's own MIME type and a Content-Disposition header - never JSON. The execute()
 * path must branch on Content-Type and return the bytes plus metadata instead of forcing
 * a JSON parse (which throws on binary bodies containing non-UTF8 bytes).
 */
describe('RequestBuilder - binary file downloads', () => {
	const downloadConfig = {
		kind: 'http',
		method: 'GET',
		url: 'https://api.example.com/download/{id}',
		bodyType: 'json',
		params: [{ name: 'id', location: ParameterLocation.PATH, type: 'string' }],
	} satisfies HttpExecuteConfig;

	it('returns raw bytes + metadata for a non-JSON (binary) response', async () => {
		// Leading bytes of a real PDF; the 0xc4 byte is invalid UTF-8 and is exactly what
		// makes an unconditional response.json() throw on a binary body.
		const pdfBytes = new Uint8Array([
			0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0xc4, 0xe5, 0xf2, 0xe5, 0xeb,
		]);
		server.use(
			http.get(
				'https://api.example.com/download/:id',
				() =>
					new HttpResponse(pdfBytes, {
						status: 200,
						headers: {
							'content-type': 'application/pdf',
							'content-disposition': 'attachment; filename="download.pdf"',
						},
					}),
			),
		);

		const builder = new RequestBuilder(downloadConfig);
		const result = await builder.execute({ id: 'file-123' });

		expect(result.content).toBeInstanceOf(Buffer);
		expect((result.content as unknown as Buffer).equals(Buffer.from(pdfBytes))).toBe(true);
		expect(result.contentType).toBe('application/pdf');
		expect(result.statusCode).toBe(200);
		expect(result.fileName).toBe('download.pdf');
		expect((result.headers as Record<string, string>)['content-type']).toBe('application/pdf');
	});

	it('returns bytes with fileName null when there is no Content-Disposition', async () => {
		const blob = new Uint8Array([0x00, 0x01, 0x02, 0xc4, 0xff, 0xfe]);
		server.use(
			http.get(
				'https://api.example.com/download/:id',
				() =>
					new HttpResponse(blob, {
						status: 200,
						headers: { 'content-type': 'application/octet-stream' },
					}),
			),
		);

		const builder = new RequestBuilder(downloadConfig);
		const result = await builder.execute({ id: 'blob' });

		expect((result.content as unknown as Buffer).equals(Buffer.from(blob))).toBe(true);
		expect(result.contentType).toBe('application/octet-stream');
		expect(result.fileName).toBeNull();
	});

	it('still parses a normal JSON response into an object (no content wrapper)', async () => {
		server.use(
			http.get('https://api.example.com/download/:id', () =>
				HttpResponse.json({ id: '123', ok: true }),
			),
		);

		const builder = new RequestBuilder(downloadConfig);
		const result = await builder.execute({ id: 'json' });

		expect(result).toEqual({ id: '123', ok: true });
		expect(result.content).toBeUndefined();
	});

	it('parses JSON when the Content-Type carries a charset parameter', async () => {
		server.use(
			http.get(
				'https://api.example.com/download/:id',
				() =>
					new HttpResponse('{"ok":true}', {
						status: 200,
						headers: { 'content-type': 'application/json; charset=utf-8' },
					}),
			),
		);

		const builder = new RequestBuilder(downloadConfig);
		const result = await builder.execute({ id: 'json-charset' });

		expect(result).toEqual({ ok: true });
	});

	it('treats a response with no Content-Type as opaque bytes, not JSON', async () => {
		// JPEG magic bytes, no content-type. The SDK trusts Content-Type to choose JSON vs
		// file, so an absent Content-Type returns raw bytes rather than risking a JSON decode.
		const blob = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
		server.use(
			http.get(
				'https://api.example.com/download/:id',
				() => new HttpResponse(blob, { status: 200 }),
			),
		);

		const builder = new RequestBuilder(downloadConfig);
		const result = await builder.execute({ id: 'no-ct' });

		expect((result.content as unknown as Buffer).equals(Buffer.from(blob))).toBe(true);
		expect(result.contentType).toBe('application/octet-stream');
		expect(result.fileName).toBeNull();
	});
});
