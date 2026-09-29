/**
 * Serialise a tool result for a model.
 *
 * A hand-built tool may return bytes as a `Buffer`, which `JSON.stringify` turns into a
 * `{ type: 'Buffer', data: [...] }` byte array — not the file, and potentially enormous. Bytes are
 * base64-encoded instead, and a `bigint` is written as its decimal string rather than throwing.
 * The replacer reads the ORIGINAL value from its holder, because `JSON.stringify` has already
 * called `Buffer#toJSON` by the time the replacer sees `value`.
 */
export function serializeToolResult(result: unknown): string {
	return JSON.stringify(result, function replacer(this: unknown, key: string, value: unknown) {
		const original = (this as Record<string, unknown>)[key];
		if (original instanceof Uint8Array) {
			return Buffer.from(original).toString('base64');
		}
		if (typeof value === 'bigint') {
			return value.toString();
		}
		return value;
	});
}
