import type { Arrayable } from 'type-fest';
import type { Nullable } from './type';

/**
 * Convert `Arrayable<T>` to `Array<T>`
 *
 * @category Array
 * @link https://github.com/antfu/utils/blob/929fdd7e70f2b5095f51218be48362901923d62e/src/array.ts
 */
export function toArray<T>(array?: Nullable<Arrayable<T>>): Array<T> {
	const _array = array ?? [];
	return Array.isArray(_array) ? _array : [_array];
}
