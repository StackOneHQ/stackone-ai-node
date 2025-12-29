import { fc, test as fcTest } from '@fast-check/vitest';
import { toArray } from './array';

/**
 * Property-Based Tests for toArray utility
 *
 * These tests verify the function's behavior for ANY valid input,
 * replacing example-based tests like:
 *
 * - toArray([1, 2, 3]) === [1, 2, 3] (same reference)
 * - toArray("hello") === ["hello"]
 * - toArray(42) === [42]
 * - toArray({ key: "value" }) === [{ key: "value" }]
 * - toArray(null) === []
 * - toArray(undefined) === []
 */
describe('toArray - Property-Based Tests', () => {
	// Example: toArray([1, 2, 3]) returns the exact same array instance, not a copy
	fcTest.prop([fc.array(fc.anything())], { numRuns: 100 })(
		'array input returns the same array reference',
		(arr) => {
			expect(toArray(arr)).toBe(arr);
		},
	);

	// Example: toArray("hello") => ["hello"], toArray(42) => [42], toArray({a:1}) => [{a:1}]
	fcTest.prop([fc.anything().filter((x) => !Array.isArray(x) && x != null)], { numRuns: 100 })(
		'non-array non-nullish input returns single-element array',
		(value) => {
			const result = toArray(value);
			expect(result).toHaveLength(1);
			expect(result[0]).toBe(value);
		},
	);

	// Example: toArray(null) => [], toArray(undefined) => []
	fcTest.prop([fc.constantFrom(null, undefined)], { numRuns: 10 })(
		'null or undefined returns empty array',
		(value) => {
			expect(toArray(value)).toEqual([]);
		},
	);

	// Invariant: no matter what input, output is always an array
	fcTest.prop([fc.anything()], { numRuns: 100 })('result is always an array', (value) => {
		expect(Array.isArray(toArray(value))).toBe(true);
	});
});
