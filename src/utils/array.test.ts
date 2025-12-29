import { fc, test as fcTest } from '@fast-check/vitest';
import { toArray } from './array';

describe('toArray - Property-Based Tests', () => {
	fcTest.prop([fc.array(fc.anything())], { numRuns: 100 })(
		'array input returns the same array reference',
		(arr) => {
			expect(toArray(arr)).toBe(arr);
		},
	);

	fcTest.prop([fc.anything().filter((x) => !Array.isArray(x) && x != null)], { numRuns: 100 })(
		'non-array non-nullish input returns single-element array',
		(value) => {
			const result = toArray(value);
			expect(result).toHaveLength(1);
			expect(result[0]).toBe(value);
		},
	);

	fcTest.prop([fc.constantFrom(null, undefined)], { numRuns: 10 })(
		'null or undefined returns empty array',
		(value) => {
			expect(toArray(value)).toEqual([]);
		},
	);

	fcTest.prop([fc.anything()], { numRuns: 100 })('result is always an array', (value) => {
		expect(Array.isArray(toArray(value))).toBe(true);
	});
});
