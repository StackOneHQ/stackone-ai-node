import { isTruthy, isTruthyString } from './type';

// Both stand in for a bare `if (value)`, so they must agree with it for every value a plain
// JavaScript caller can pass, including ones the types forbid.
const values: unknown[] = ['', 'a', 0, 1, Number.NaN, false, true, null, undefined, {}, []];

describe('isTruthy', () => {
	it.each(values)('agrees with a bare truthiness test for %o', (value) => {
		expect(isTruthy(value)).toBe(Boolean(value));
	});
});

describe('isTruthyString', () => {
	it.each(values)('agrees with a bare truthiness test for %o', (value) => {
		// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- values a JavaScript caller can pass
		expect(isTruthyString(value as string)).toBe(Boolean(value));
	});
});
