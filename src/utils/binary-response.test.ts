import { filenameFromContentDisposition, isJsonContentType } from './binary-response';

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
		// Malformed percent-encoding must not throw - fall back to the raw (undecoded) value.
		["attachment; filename*=UTF-8''bad%ZZname", 'bad%ZZname'],
		['attachment', null],
		[null, null],
		['', null],
	])('filenameFromContentDisposition(%j) === %j', (input, expected) => {
		expect(filenameFromContentDisposition(input as string | null)).toBe(expected);
	});
});
