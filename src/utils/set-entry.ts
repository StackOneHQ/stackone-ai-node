/**
 * Set `key` on `target` as an own, enumerable property. Plain assignment with the key
 * `__proto__` replaces the prototype instead, so the entry would vanish from the request.
 */
export function setEntry<T>(target: Record<string, T>, key: string, value: T): void {
	Object.defineProperty(target, key, {
		value,
		enumerable: true,
		writable: true,
		configurable: true,
	});
}
