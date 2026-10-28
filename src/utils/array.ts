import type { Arrayable } from 'type-fest';
import type { Nullable } from './type';

/**
 * Convert `Arrayable<T>` to `Array<T>`
 *
 * @see https://github.com/antfu/utils/blob/929fdd7e70f2b5095f51218be48362901923d62e/src/array.ts
 */
/**
 * The items of `items` in a new, sorted array. `Array#toSorted` is not in the ES2022 lib this
 * package targets.
 */
export function sorted<T>(items: Iterable<T>, compare?: (a: T, b: T) => number): T[] {
	// oxlint-disable-next-line unicorn/no-array-sort -- sorts a copy; toSorted is not in the ES2022 lib
	return [...items].sort(compare);
}

export function toArray<T>(array?: Nullable<Arrayable<T>>): Array<T> {
	const items = array ?? [];
	return Array.isArray(items) ? items : [items];
}
