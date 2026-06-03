/**
 * Shared handling for binary (file-download) HTTP responses.
 *
 * StackOne serves file downloads as raw binary with the file's own MIME type and a
 * Content-Disposition header - never as the usual JSON envelope. Both the HTTP tool path
 * (RequestBuilder) and the RPC tool path (RpcClient) must therefore decide JSON-vs-file by
 * Content-Type and return the bytes plus metadata instead of forcing a JSON parse.
 */

/**
 * Result of a non-JSON (file-download) response: the raw bytes plus metadata.
 *
 * Note: `content` is a raw `Buffer`, not a `JsonValue`. `JSON.stringify` turns a Buffer into a
 * `{ type: 'Buffer', data: [...] }` byte array (not the file, and potentially huge), so callers
 * that re-serialize tool results (e.g. for an LLM) should strip or transform this key.
 */
export interface BinaryDownloadResult {
	content: Buffer;
	contentType: string;
	statusCode: number;
	headers: Record<string, string>;
	fileName: string | null;
}

/**
 * Whether a response body should be parsed as JSON based on its Content-Type.
 *
 * Only genuine JSON media types are parsed (`application/json` and structured suffixes such
 * as `application/problem+json`). Anything else - including a missing Content-Type - is treated
 * as opaque content (a file download), so the raw bytes are returned instead of being
 * force-decoded as UTF-8/JSON. This mirrors how the StackOne generated SDKs default unknown
 * bodies to `application/octet-stream`.
 */
export function isJsonContentType(contentType: string): boolean {
	const mediaType = contentType.split(';')[0]?.trim().toLowerCase() ?? '';
	return mediaType === 'application/json' || mediaType.endsWith('+json');
}

/**
 * Extract the filename from a Content-Disposition header value, if present.
 *
 * Handles both the plain `filename="example.pdf"` form and the RFC 5987 extended
 * `filename*=UTF-8''example%20file.pdf` form (which is percent-decoded and takes precedence
 * when present). Returns null when no filename is present.
 */
export function filenameFromContentDisposition(value: string | null): string | null {
	if (!value) {
		return null;
	}
	const extended = value.match(/filename\*\s*=\s*[^']*'[^']*'([^;]+)/i);
	if (extended?.[1]) {
		const encoded = extended[1].trim();
		try {
			return decodeURIComponent(encoded);
		} catch {
			// Malformed percent-encoding: fall back to the raw value rather than throwing and
			// breaking an otherwise-valid download over a bad Content-Disposition header.
			return encoded;
		}
	}
	const quoted = value.match(/filename\s*=\s*"([^"]*)"/i);
	if (quoted) {
		return quoted[1]?.trim() || null;
	}
	const bare = value.match(/filename\s*=\s*([^;]+)/i);
	if (bare?.[1]) {
		return bare[1].trim().replace(/^"+|"+$/g, '') || null;
	}
	return null;
}

/**
 * Read a non-JSON `Response` into a {@link BinaryDownloadResult} (bytes + metadata).
 *
 * Assumes the caller has already decided the body is non-JSON (see {@link isJsonContentType});
 * consumes the response body via `arrayBuffer()`.
 */
export async function binaryDownloadFromResponse(
	response: Response,
): Promise<BinaryDownloadResult> {
	const contentType = response.headers.get('content-type') ?? '';
	return {
		content: Buffer.from(await response.arrayBuffer()),
		contentType: contentType || 'application/octet-stream',
		statusCode: response.status,
		headers: Object.fromEntries(response.headers.entries()),
		fileName: filenameFromContentDisposition(response.headers.get('content-disposition')),
	};
}

/**
 * Type guard for a {@link BinaryDownloadResult} - true when `content` carries raw bytes.
 */
export function isBinaryDownloadResult(value: unknown): value is BinaryDownloadResult {
	return (
		typeof value === 'object' &&
		value !== null &&
		Buffer.isBuffer((value as { content?: unknown }).content)
	);
}
