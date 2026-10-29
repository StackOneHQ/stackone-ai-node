/**
 * A type that can be null or undefined
 */
export type Nullable<T> = T | null | undefined;

/** Whether a string is present and not empty: what a bare truthiness test on it would check. */
export const isNonEmpty = (value: Nullable<string>): value is string =>
	value !== undefined && value !== null && value !== '';

/**
 * Whether a value is truthy: exactly what `if (value)` checks, for values a plain JavaScript caller
 * can make falsy in ways the types do not allow (`false`, `0`, `''`). A plain boolean rather than a
 * type guard: a guard cannot say "truthy" for a broad type like `string` or `number` without
 * claiming its false branch is unreachable. Pair it with `!= null` where the type must narrow.
 */
export const isTruthy = (value: unknown): boolean => Boolean(value);

/**
 * Whether a string is truthy: exactly what `if (value)` checks, whatever a plain JavaScript caller
 * actually passes. Narrows to `string` as {@link isNonEmpty} does.
 */
export const isTruthyString = (value: Nullable<string>): value is string => Boolean(value);
