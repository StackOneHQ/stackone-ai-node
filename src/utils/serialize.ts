/**
 * Serialise a tool result for a model.
 *
 * A hand-built tool may return bytes as a `Buffer`, which `JSON.stringify` turns into a
 * `{ type: 'Buffer', data: [...] }` byte array — not the file, and potentially enormous. Bytes are
 * base64-encoded instead, and a `bigint` is written as its decimal string rather than throwing.
 * The replacer reads the ORIGINAL value from its holder, because `JSON.stringify` has already
 * called `Buffer#toJSON` by the time the replacer sees `value`.
 *
 * A result `JSON.stringify` cannot represent — `undefined`, from a hand-built tool that returns
 * nothing — is written as `"null"`, as the Python SDK's `json.dumps(None)` writes it, rather than
 * becoming a message with no content at all.
 */
export function serializeToolResult(result: unknown): string {
	const serialized: string | undefined = JSON.stringify(
		result,
		function replacer(this: unknown, key: string, value: unknown) {
			const original = (this as Record<string, unknown>)[key];
			if (original instanceof Uint8Array) {
				return Buffer.from(original).toString('base64');
			}
			if (typeof value === 'bigint') {
				return value.toString();
			}
			return value;
		},
	);
	return serialized ?? 'null';
}
