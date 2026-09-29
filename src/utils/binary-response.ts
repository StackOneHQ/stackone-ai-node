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

/** The longest filename, in UTF-8 bytes, that common filesystems (ext4, APFS, NTFS) accept. */
const MAX_FILENAME_BYTES = 255;

/** Control (Cc) and format (Cf) characters: log/header injection and bidi extension spoofing. */
const CONTROL_OR_FORMAT_CHARS = /[\p{Cc}\p{Cf}]/gu;

const utf8Encoder = new TextEncoder();

/** Truncate to at most `maxBytes` UTF-8 bytes without splitting a character. */
function truncateUtf8(value: string, maxBytes: number): string {
	let bytes = 0;
	let end = 0;
	for (const char of value) {
		const size = utf8Encoder.encode(char).length;
		if (bytes + size > maxBytes) {
			break;
		}
		bytes += size;
		end += char.length;
	}
	return value.slice(0, end);
}

/**
 * Reduce a server-supplied filename to a bare, writable basename, or `null` if nothing usable
 * is left.
 *
 * The value comes from a remote `Content-Disposition`, which in practice is chosen by whoever
 * uploaded the file to the connected provider — so it is attacker-controlled. Returned as-is it
 * is an arbitrary-file-write primitive for any caller that does the obvious thing and passes it
 * to `writeFile()`: `../../.ssh/authorized_keys` and `/etc/cron.d/x` both round-trip. The RFC
 * 5987 branch percent-decodes, so a filter applied before this point would be bypassed anyway;
 * sanitise last, here, once.
 *
 * - `/` and `\` are both path separators, whatever the host OS.
 * - `:` is too: `C:evil.exe` writes to drive C:'s current directory on Windows, and
 *   `report.pdf:payload` writes an NTFS alternate data stream.
 * - Control and Unicode format characters are removed — U+202E renders `\u202egnp.exe` as
 *   `…exe.png`, the classic extension spoof.
 * - The result is capped at 255 UTF-8 bytes, keeping the extension when there is one.
 */
export function safeBasename(name: string | null | undefined): string | null {
	if (name == null) {
		return null;
	}
	const lastSegment = name.split(/[/\\:]/).at(-1) ?? '';
	const base = lastSegment.replace(CONTROL_OR_FORMAT_CHARS, '').trim();
	if (base === '' || base === '.' || base === '..') {
		return null;
	}
	if (utf8Encoder.encode(base).length <= MAX_FILENAME_BYTES) {
		return base;
	}
	const dot = base.lastIndexOf('.');
	const suffix = dot > 0 ? base.slice(dot) : '';
	const suffixBytes = utf8Encoder.encode(suffix).length;
	// An extension that cannot fit alongside at least one character of stem is not worth
	// keeping: truncate the whole name instead of emitting something still over the limit.
	if (suffix === '' || suffixBytes >= MAX_FILENAME_BYTES) {
		return truncateUtf8(base, MAX_FILENAME_BYTES);
	}
	return truncateUtf8(base.slice(0, dot), MAX_FILENAME_BYTES - suffixBytes) + suffix;
}

/**
 * Decode `%XX` escapes as bytes in `charset`, the way Python's `urllib.parse.unquote` does:
 * malformed escapes stay literal, and bytes that do not decode become U+FFFD rather than
 * throwing. An unknown charset label falls back to UTF-8.
 */
function percentDecode(encoded: string, charset: string): string {
	let decoder: InstanceType<typeof TextDecoder>;
	try {
		decoder = new TextDecoder(charset);
	} catch {
		decoder = new TextDecoder('utf-8');
	}
	return encoded.replace(/(?:%[0-9A-Fa-f]{2})+/g, (run) =>
		decoder.decode(Uint8Array.from(run.slice(1).split('%'), (hex) => Number.parseInt(hex, 16))),
	);
}

/**
 * Extract the filename from a Content-Disposition header value, reduced to a safe basename.
 *
 * Handles both the plain `filename="example.pdf"` form and the RFC 5987 extended
 * `filename*=UTF-8''example%20file.pdf` form, which takes precedence when present. The extended
 * form is percent-decoded using its declared charset (RFC 5987 permits both `UTF-8` and
 * `ISO-8859-1`). Parameters are matched at a parameter boundary, so `notfilename=` is ignored.
 * Returns null when no usable filename is present — see {@link safeBasename}.
 */
export function filenameFromContentDisposition(value: string | null | undefined): string | null {
	if (!value) {
		return null;
	}
	const extended = value.match(/(?:^|;)\s*filename\*\s*=\s*([^']*)'[^']*'([^;]+)/i);
	if (extended) {
		const charset = extended[1]?.trim() || 'utf-8';
		const encoded = (extended[2] ?? '').trim().replace(/^"+|"+$/g, '');
		return safeBasename(percentDecode(encoded, charset));
	}
	const quoted = value.match(/(?:^|;)\s*filename\s*=\s*"([^"]*)"/i);
	if (quoted) {
		return safeBasename(quoted[1]);
	}
	const bare = value.match(/(?:^|;)\s*filename\s*=\s*([^;]+)/i);
	if (bare) {
		return safeBasename((bare[1] ?? '').replace(/^"+|"+$/g, ''));
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
