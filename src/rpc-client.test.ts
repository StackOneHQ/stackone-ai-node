import { createServer, type Server as NetServer, type Socket } from 'node:net';
import { http, HttpResponse } from 'msw';
import { TEST_BASE_URL } from '../mocks/constants';
import { server } from '../mocks/node';
import { USER_AGENT } from './consts';
import { RpcClient } from './rpc-client';
import { isBinaryDownloadResult } from './utils/binary-response';
import { StackOneAPIError } from './utils/error-stackone-api';
import { StackOneError } from './utils/error-stackone';

const newClient = (overrides: Partial<ConstructorParameters<typeof RpcClient>[0]> = {}) =>
	new RpcClient({ baseUrl: TEST_BASE_URL, apiKey: 'test-api-key', timeout: 5_000, ...overrides });

const request = (action: string, extra: Record<string, unknown> = {}) => ({
	action,
	body: {},
	headers: {},
	...extra,
});

const captureRequests = () => {
	const seen: Request[] = [];
	server.use(
		http.post(`${TEST_BASE_URL}/actions/rpc`, ({ request: incoming }) => {
			seen.push(incoming.clone());
			return HttpResponse.json({ data: { ok: true } });
		}),
	);
	return seen;
};

describe('RpcClient', () => {
	it('posts the envelope to /actions/rpc with Basic auth, a versioned User-Agent and the account', async () => {
		const seen = captureRequests();

		const result = await newClient().rpcAction(
			request('crm_list_contacts', { query: { limit: 1 }, headers: { 'x-account-id': 'acc-1' } }),
			'acc-1',
		);

		expect(result).toEqual({ data: { ok: true } });
		const [sent] = seen;
		assert(sent);
		expect(sent.url).toBe(`${TEST_BASE_URL}/actions/rpc`);
		expect(sent.headers.get('authorization')).toBe(
			`Basic ${Buffer.from('test-api-key:').toString('base64')}`,
		);
		expect(sent.headers.get('user-agent')).toBe(USER_AGENT);
		expect(sent.headers.get('x-account-id')).toBe('acc-1');
		expect(await sent.json()).toEqual({
			action: 'crm_list_contacts',
			body: {},
			headers: { 'x-account-id': 'acc-1' },
			query: { limit: 1 },
		});
	});

	// The account on the wire is the caller's argument, never a copy lifted out of the envelope:
	// the envelope is model-supplied.
	it('takes x-account-id from the tool, not from the envelope', async () => {
		const seen = captureRequests();

		await newClient().rpcAction(
			request('crm_list_contacts', { headers: { 'x-account-id': 'victim' } }),
			'acc-1',
		);

		expect(seen[0]?.headers.get('x-account-id')).toBe('acc-1');
	});

	it('sends no x-account-id at all without an account, and the API refuses it', async () => {
		const error = await newClient()
			.rpcAction(request('dummy_action'), undefined)
			.catch((caught: unknown) => caught);

		expect(error).toBeInstanceOf(StackOneAPIError);
		expect((error as StackOneAPIError).statusCode).toBe(400);
	});

	it('refuses an account the API does not know', async () => {
		const error = await newClient()
			.rpcAction(request('dummy_action'), 'no-such-account')
			.catch((caught: unknown) => caught);

		expect((error as StackOneAPIError).statusCode).toBe(404);
	});

	it('lets caller headers through beneath the SDK-owned ones', async () => {
		const seen = captureRequests();

		await newClient({
			headers: { 'X-Trace': 't-1', authorization: 'Bearer spoofed', 'X-Account-Id': 'other' },
		}).rpcAction(request('crm_list_contacts'), 'acc-1');

		const sent = seen[0];
		expect(sent?.headers.get('x-trace')).toBe('t-1');
		expect(sent?.headers.get('authorization')).toMatch(/^Basic /);
		expect(sent?.headers.get('x-account-id')).toBe('acc-1');
	});

	it('leads an API error with the server message and keeps status and body', async () => {
		server.use(
			http.post(`${TEST_BASE_URL}/actions/rpc`, () =>
				HttpResponse.json(
					{ message: 'path.id is missing', provider_errors: [{ status: 400 }] },
					{ status: 400, statusText: 'Bad Request' },
				),
			),
		);

		const error = (await newClient()
			.rpcAction(request('crm_get_contact'), 'acc-1')
			.catch((caught: unknown) => caught)) as StackOneAPIError;

		expect(error).toBeInstanceOf(StackOneAPIError);
		expect(error.message).toBe('400 Bad Request: path.id is missing');
		expect(error.statusCode).toBe(400);
		expect(error.responseBody).toEqual({
			message: 'path.id is missing',
			provider_errors: [{ status: 400 }],
		});
		expect(error.providerErrors).toEqual([{ status: 400 }]);
	});

	it('reports a non-JSON error body as text rather than throwing a SyntaxError', async () => {
		server.use(
			http.post(
				`${TEST_BASE_URL}/actions/rpc`,
				() =>
					new HttpResponse('<html>502 Bad Gateway</html>', {
						status: 502,
						statusText: 'Bad Gateway',
						headers: { 'content-type': 'text/html' },
					}),
			),
		);

		const error = (await newClient()
			.rpcAction(request('x'), 'acc-1')
			.catch((caught: unknown) => caught)) as StackOneAPIError;

		expect(error).toBeInstanceOf(StackOneAPIError);
		expect(error.statusCode).toBe(502);
		expect(error.responseBody).toBe('<html>502 Bad Gateway</html>');
		expect(error.message).toContain('502 Bad Gateway: <html>');
	});

	it('blames the server, not the arguments, for malformed JSON', async () => {
		server.use(
			http.post(
				`${TEST_BASE_URL}/actions/rpc`,
				() => new HttpResponse('{not json', { headers: { 'content-type': 'application/json' } }),
			),
		);

		await expect(newClient().rpcAction(request('x'), 'acc-1')).rejects.toThrow(
			/Server sent malformed JSON for "x"/,
		);
	});

	it('wraps a non-object JSON response as { result }', async () => {
		server.use(http.post(`${TEST_BASE_URL}/actions/rpc`, () => HttpResponse.json(['a', 'b'])));

		expect(await newClient().rpcAction(request('x'), 'acc-1')).toEqual({ result: ['a', 'b'] });
	});

	it.each([204, 205])('returns { statusCode } for a bodyless %i', async (status) => {
		server.use(http.post(`${TEST_BASE_URL}/actions/rpc`, () => new HttpResponse(null, { status })));

		expect(await newClient().rpcAction(request('x'), 'acc-1')).toEqual({ statusCode: status });
	});

	it('returns { statusCode } for an empty JSON body rather than a fake download', async () => {
		server.use(
			http.post(
				`${TEST_BASE_URL}/actions/rpc`,
				() => new HttpResponse('', { headers: { 'content-type': 'application/json' } }),
			),
		);

		expect(await newClient().rpcAction(request('x'), 'acc-1')).toEqual({ statusCode: 200 });
	});

	it('reports arguments JSON cannot encode as an argument error', async () => {
		await expect(
			newClient().rpcAction(request('x', { body: { big: 1n as never } }), 'acc-1'),
		).rejects.toThrow(/could not be encoded as JSON/);
	});

	it('reports a network failure as a StackOneError', async () => {
		server.use(http.post(`${TEST_BASE_URL}/actions/rpc`, () => HttpResponse.error()));

		const error = await newClient()
			.rpcAction(request('x'), 'acc-1')
			.catch((caught: unknown) => caught);

		expect(error).toBeInstanceOf(StackOneError);
		expect((error as Error).message).toMatch(/^Request failed/);
	});
});

describe('RpcClient timeout', () => {
	let silent: NetServer;
	const sockets: Socket[] = [];
	let port = 0;

	beforeAll(async () => {
		// Accepts the connection and never answers — the case a per-request default would hang on.
		silent = createServer((socket) => sockets.push(socket));
		await new Promise<void>((resolve) => silent.listen(0, '127.0.0.1', resolve));
		port = (silent.address() as { port: number }).port;
	});
	afterAll(async () => {
		for (const socket of sockets) {
			socket.destroy();
		}
		await new Promise((resolve) => silent.close(resolve));
	});

	it('gives up after the configured timeout', async () => {
		const started = Date.now();
		const error = await newClient({ baseUrl: `http://127.0.0.1:${port}`, timeout: 300 })
			.rpcAction(request('x'), 'acc-1')
			.catch((caught: unknown) => caught);

		expect(error).toBeInstanceOf(StackOneError);
		expect((error as Error).message).toMatch(/timed out after 300ms/);
		expect(Date.now() - started).toBeLessThan(5_000);
	});
});

/**
 * File-download actions (e.g. googledrive_unified_download_file) are served over /actions/rpc
 * as raw binary with the file's own MIME type and a Content-Disposition header - never JSON.
 */
describe('binary file downloads', () => {
	it('returns raw bytes + metadata for a non-JSON (binary) RPC response', async () => {
		// Leading bytes of a real PDF; the 0xc4 byte is invalid UTF-8 and is exactly what makes
		// an unconditional response.json() throw on a binary body.
		const pdfBytes = new Uint8Array([
			0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0xc4, 0xe5, 0xf2, 0xe5, 0xeb,
		]);
		server.use(
			http.post(
				`${TEST_BASE_URL}/actions/rpc`,
				() =>
					new HttpResponse(pdfBytes, {
						status: 200,
						headers: {
							'content-type': 'application/pdf',
							'content-disposition': 'attachment; filename="../../download.pdf"',
						},
					}),
			),
		);

		const result = await newClient().rpcAction(
			request('googledrive_unified_download_file', { path: { id: 'file-123' } }),
			'acc-1',
		);

		assert(isBinaryDownloadResult(result), 'expected a binary download result');
		expect(result.content.equals(Buffer.from(pdfBytes))).toBe(true);
		expect(result.contentType).toBe('application/pdf');
		expect(result.statusCode).toBe(200);
		// Reduced to a basename: the traversal never reaches the caller.
		expect(result.fileName).toBe('download.pdf');
		expect(result.headers['content-type']).toBe('application/pdf');
	});

	it('returns bytes with fileName null when there is no Content-Disposition', async () => {
		const blob = new Uint8Array([0x00, 0x01, 0x02, 0xc4, 0xff, 0xfe]);
		server.use(
			http.post(
				`${TEST_BASE_URL}/actions/rpc`,
				() => new HttpResponse(blob, { headers: { 'content-type': 'application/octet-stream' } }),
			),
		);

		const result = await newClient().rpcAction(request('some_unified_download_file'), 'acc-1');

		assert(isBinaryDownloadResult(result), 'expected a binary download result');
		expect(result.content.equals(Buffer.from(blob))).toBe(true);
		expect(result.fileName).toBeNull();
	});

	it('treats a missing Content-Type as opaque bytes, not JSON', async () => {
		const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
		server.use(http.post(`${TEST_BASE_URL}/actions/rpc`, () => new HttpResponse(jpeg)));

		const result = await newClient().rpcAction(request('x'), 'acc-1');

		assert(isBinaryDownloadResult(result), 'expected a binary download result');
		expect(result.contentType).toBe('application/octet-stream');
	});

	it('parses JSON when the Content-Type carries a charset parameter', async () => {
		server.use(
			http.post(
				`${TEST_BASE_URL}/actions/rpc`,
				() =>
					new HttpResponse('{"data":{"ok":true}}', {
						headers: { 'content-type': 'application/json; charset=utf-8' },
					}),
			),
		);

		expect(await newClient().rpcAction(request('x'), 'acc-1')).toEqual({ data: { ok: true } });
	});
});
