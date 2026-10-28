/**
 * A type that can be null or undefined
 */
export type Nullable<T> = T | null | undefined;

/** Whether a string is present and not empty: what a bare truthiness test on it would check. */
export const isNonEmpty = (value: Nullable<string>): value is string =>
	value !== undefined && value !== null && value !== '';

/** The values a bare truthiness test rejects. */
export type Falsy = false | 0 | '' | null | undefined;

/**
 * Whether a value is truthy: exactly what `if (value)` checks, as a type guard, for values a
 * plain JavaScript caller can make falsy in ways the types do not allow.
 */
export const isTruthy = <T>(value: T): value is Exclude<T, Falsy> => Boolean(value);
