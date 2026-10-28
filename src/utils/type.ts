/**
 * A type that can be null or undefined
 */
export type Nullable<T> = T | null | undefined;

/** Whether a string is present and not empty: what a bare truthiness test on it would check. */
export const isNonEmpty = (value: Nullable<string>): value is string =>
	value !== undefined && value !== null && value !== '';
