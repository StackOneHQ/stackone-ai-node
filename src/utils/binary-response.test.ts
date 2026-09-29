import { filenameFromContentDisposition, isJsonContentType, safeBasename } from './binary-response';

/**
 * Unit tests for the Content-Type and Content-Disposition parsing helpers that drive the
 * JSON-vs-file decision and filename extraction shared by the HTTP and RPC tool paths.
 */
describe('isJsonContentType', () => {
	it.each([
		['application/json', true],
		['application/json; charset=utf-8', true],
		['APPLICATION/JSON', true],
		['application/problem+json', true],
		['application/vnd.api+json', true],
		['', false],
		['application/pdf', false],
		['application/octet-stream', false],
		['text/plain', false],
		['text/json-but-not-really', false],
	])('isJsonContentType(%j) === %s', (input, expected) => {
		expect(isJsonContentType(input as string)).toBe(expected);
	});
});

describe('filenameFromContentDisposition', () => {
	it.each([
		['attachment; filename="download.pdf"', 'download.pdf'],
		['attachment; filename=download.pdf', 'download.pdf'],
		['inline; filename="my report.docx"', 'my report.docx'],
		// RFC 5987 extended form is percent-decoded and takes precedence over the plain form.
		['attachment; filename="fallback.txt"; filename*=UTF-8\'\'na%C3%AFve.txt', 'naïve.txt'],
		// Malformed percent-encoding must not throw - the malformed escape stays literal.
		["attachment; filename*=UTF-8''bad%ZZname", 'bad%ZZname'],
		// Non-UTF-8 charset is honoured: 0xA3 is "£" in ISO-8859-1, not UTF-8.
		["attachment; filename*=ISO-8859-1'en'%A3%20rates.txt", '£ rates.txt'],
		// Unknown charset label falls back to UTF-8 instead of throwing.
		["attachment; filename*=bogus-charset''%C2%A3.txt", '£.txt'],
		// Non-conformant quoted extended value: surrounding quotes are stripped.
		['attachment; filename*="UTF-8\'\'na%C3%AFve.txt"', 'naïve.txt'],
		['attachment', null],
		[null, null],
		['', null],
	])('filenameFromContentDisposition(%j) === %j', (input, expected) => {
		expect(filenameFromContentDisposition(input as string | null)).toBe(expected);
	});
});

/**
 * The filename comes from a Content-Disposition that whoever uploaded the file chose, so it is
 * attacker-controlled. Ported from the Python SDK's `_safe_basename` cases.
 */
describe('download filenames are safe to write', () => {
	it.each([
		['attachment; filename="../../.ssh/authorized_keys"', 'authorized_keys'],
		["attachment; filename*=UTF-8''%2e%2e%2f%2e%2e%2fetc%2fcron.d%2fx", 'x'],
		['attachment; filename="/etc/passwd"', 'passwd'],
		['attachment; filename="C:evil.exe"', 'evil.exe'],
		['attachment; filename="..\\\\..\\\\windows\\\\x.dll"', 'x.dll'],
		["attachment; filename*=UTF-8''..%5C..%5Cwindows%5Cx.dll", 'x.dll'],
		['attachment; filename="report.pdf:hidden.exe"', 'hidden.exe'],
		['attachment; filename="\u202egnp.exe"', 'gnp.exe'],
		['attachment; filename="line\u0000break\u0007.txt"', 'linebreak.txt'],
		['attachment; filename=".."', null],
		["attachment; filename*=UTF-8''%2e%2e", null],
		['attachment; filename="   "', null],
		['attachment; notfilename="decoy.txt"', null],
		['attachment; filename="report.pdf"', 'report.pdf'],
	])('%j -> %j', (header, expected) => {
		expect(filenameFromContentDisposition(header)).toBe(expected);
	});

	const byteLength = (value: string) => new TextEncoder().encode(value).length;

	it('caps an overlong name at 255 bytes, keeping the extension', () => {
		const name = filenameFromContentDisposition(`attachment; filename="${'a'.repeat(400)}.pdf"`);
		expect(name?.endsWith('.pdf')).toBe(true);
		expect(byteLength(name ?? '')).toBeLessThanOrEqual(255);
	});

	it('caps multi-byte names on a character boundary', () => {
		const name = safeBasename(`${'é'.repeat(300)}.txt`);
		expect(name?.endsWith('.txt')).toBe(true);
		expect(byteLength(name ?? '')).toBeLessThanOrEqual(255);
		expect(name).not.toContain('\uFFFD');
	});

	it('caps an overlong name with no extension', () => {
		expect(byteLength(safeBasename('b'.repeat(400)) ?? '')).toBe(255);
	});

	it('caps a name whose extension alone is overlong', () => {
		expect(byteLength(safeBasename(`a.${'c'.repeat(400)}`) ?? '')).toBe(255);
	});

	it('passes null through', () => {
		expect(safeBasename(null)).toBeNull();
		expect(safeBasename(undefined)).toBeNull();
	});
});
