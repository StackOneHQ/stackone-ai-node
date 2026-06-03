import { http, HttpResponse } from 'msw';
import { TEST_BASE_URL } from '../mocks/constants';
import { server } from '../mocks/node';
import { type RpcActionResponse, RpcClient } from './rpc-client';
import { stackOneHeadersSchema } from './headers';
import { type BinaryDownloadResult, isBinaryDownloadResult } from './utils/binary-response';
import { StackOneAPIError } from './utils/error-stackone-api';

/**
 * Narrow an rpcAction result to the JSON envelope, failing the test if the call returned a binary
 * download instead. rpcAction returns `RpcActionResponse | BinaryDownloadResult`, so the JSON-path
 * assertions below need the non-binary branch to stay type-safe.
 */
function expectJsonResponse(result: RpcActionResponse | BinaryDownloadResult): RpcActionResponse {
	if (isBinaryDownloadResult(result)) {
		throw new Error('expected a JSON RPC response, received a binary download');
	}
	return result;
}

test('should successfully execute an RPC action', async () => {
	const client = new RpcClient({
		serverURL: TEST_BASE_URL,
		security: { username: 'test-api-key' },
	});

	const response = expectJsonResponse(
		await client.actions.rpcAction({
			action: 'bamboohr_get_employee',
			body: { fields: 'name,email' },
			path: { id: 'emp-123' },
		}),
	);

	// Response matches server's ActionsRpcResponseApiModel structure
	expect(response).toHaveProperty('data');
	expect(response.data).toMatchObject({
		id: 'emp-123',
		name: 'Test Employee',
	});
});

test('should send correct payload structure', async () => {
	const client = new RpcClient({
		serverURL: TEST_BASE_URL,
		security: { username: 'test-api-key' },
	});

	const response = expectJsonResponse(
		await client.actions.rpcAction({
			action: 'custom_action',
			body: { key: 'value' },
			headers: stackOneHeadersSchema.parse({ 'x-custom': 'header' }),
			path: { id: '123' },
			query: { filter: 'active' },
		}),
	);

	// Response matches server's ActionsRpcResponseApiModel structure
	expect(response.data).toMatchObject({
		action: 'custom_action',
		received: {
			body: { key: 'value' },
			headers: { 'x-custom': 'header' },
			path: { id: '123' },
			query: { filter: 'active' },
		},
	});
});

test('should handle list actions with array data', async () => {
	const client = new RpcClient({
		serverURL: TEST_BASE_URL,
		security: { username: 'test-api-key' },
	});

	const response = expectJsonResponse(
		await client.actions.rpcAction({
			action: 'bamboohr_list_employees',
		}),
	);

	// Response data can be an array (matches RpcActionResponseData union type)
	expect(Array.isArray(response.data)).toBe(true);
	expect(response.data).toMatchObject([
		{ id: expect.any(String), name: expect.any(String) },
		{ id: expect.any(String), name: expect.any(String) },
	]);
});

test('should throw StackOneAPIError on server error', async () => {
	const client = new RpcClient({
		serverURL: TEST_BASE_URL,
		security: { username: 'test-api-key' },
	});

	await expect(
		client.actions.rpcAction({
			action: 'test_error_action',
		}),
	).rejects.toThrow(StackOneAPIError);
});

test('should include request body in error for debugging', async () => {
	const client = new RpcClient({
		serverURL: TEST_BASE_URL,
		security: { username: 'test-api-key' },
	});

	await expect(
		client.actions.rpcAction({
			action: 'test_error_action',
			body: { debug: 'data' },
		}),
	).rejects.toMatchObject({
		statusCode: 500,
		requestBody: { action: 'test_error_action' },
	});
});

test('should work with only action parameter', async () => {
	const client = new RpcClient({
		serverURL: TEST_BASE_URL,
		security: { username: 'test-api-key' },
	});

	const response = await client.actions.rpcAction({
		action: 'simple_action',
	});

	// Response has data field (server returns { data: { action, received } })
	expect(response).toHaveProperty('data');
});

test('should send x-account-id as HTTP header', async () => {
	const client = new RpcClient({
		serverURL: TEST_BASE_URL,
		security: { username: 'test-api-key' },
	});

	const response = expectJsonResponse(
		await client.actions.rpcAction({
			action: 'test_account_id_header',
			headers: stackOneHeadersSchema.parse({ 'x-account-id': 'test-account-123' }),
		}),
	);

	// Verify x-account-id is sent both as HTTP header and in request body
	expect(response.data).toMatchObject({
		httpHeader: 'test-account-123',
		bodyHeader: 'test-account-123',
	});
});

test('should forward defender_config in request payload', async () => {
	const client = new RpcClient({
		serverURL: TEST_BASE_URL,
		security: { username: 'test-api-key' },
	});

	const response = expectJsonResponse(
		await client.actions.rpcAction({
			action: 'custom_action',
			defender_config: { enabled: true, block_high_risk: false },
		}),
	);

	expect(response.data).toMatchObject({
		received: { defender_config: { enabled: true, block_high_risk: false } },
	});
});

test('should omit defender_config from payload when not provided', async () => {
	const client = new RpcClient({
		serverURL: TEST_BASE_URL,
		security: { username: 'test-api-key' },
	});

	const response = expectJsonResponse(
		await client.actions.rpcAction({
			action: 'custom_action',
		}),
	);

	expect((response.data as Record<string, unknown>).received).not.toHaveProperty('defender_config');
});

/**
 * Binary file downloads over RPC
 *
 * File-download actions (e.g. googledrive_unified_download_file) are served over /actions/rpc
 * as raw binary with the file's own MIME type and a Content-Disposition header - never the
 * JSON {data,next} envelope. rpcAction must branch on Content-Type and return the bytes plus
 * metadata instead of forcing a JSON parse (which throws on binary) or the envelope schema.
 */
describe('binary file downloads', () => {
	const newClient = () =>
		new RpcClient({ serverURL: TEST_BASE_URL, security: { username: 'test-api-key' } });

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
							'content-disposition': 'attachment; filename="download.pdf"',
						},
					}),
			),
		);

		const result = await newClient().actions.rpcAction({
			action: 'googledrive_unified_download_file',
			path: { id: 'file-123' },
			query: { export_format: 'application/pdf' },
		});

		expect(isBinaryDownloadResult(result)).toBe(true);
		if (!isBinaryDownloadResult(result)) throw new Error('expected a binary download result');
		expect(result.content.equals(Buffer.from(pdfBytes))).toBe(true);
		expect(result.contentType).toBe('application/pdf');
		expect(result.statusCode).toBe(200);
		expect(result.fileName).toBe('download.pdf');
		expect(result.headers['content-type']).toBe('application/pdf');
	});

	it('returns bytes with fileName null when there is no Content-Disposition', async () => {
		const blob = new Uint8Array([0x00, 0x01, 0x02, 0xc4, 0xff, 0xfe]);
		server.use(
			http.post(
				`${TEST_BASE_URL}/actions/rpc`,
				() =>
					new HttpResponse(blob, {
						status: 200,
						headers: { 'content-type': 'application/octet-stream' },
					}),
			),
		);

		const result = await newClient().actions.rpcAction({ action: 'some_unified_download_file' });

		expect(isBinaryDownloadResult(result)).toBe(true);
		if (!isBinaryDownloadResult(result)) throw new Error('expected a binary download result');
		expect(result.content.equals(Buffer.from(blob))).toBe(true);
		expect(result.contentType).toBe('application/octet-stream');
		expect(result.fileName).toBeNull();
	});

	it('still parses a normal JSON envelope (regression)', async () => {
		const result = await newClient().actions.rpcAction({
			action: 'bamboohr_get_employee',
			path: { id: 'emp-123' },
		});

		expect(isBinaryDownloadResult(result)).toBe(false);
		expect(result).toHaveProperty('data');
	});

	it('parses JSON when the Content-Type carries a charset parameter', async () => {
		server.use(
			http.post(
				`${TEST_BASE_URL}/actions/rpc`,
				() =>
					new HttpResponse('{"data":{"ok":true}}', {
						status: 200,
						headers: { 'content-type': 'application/json; charset=utf-8' },
					}),
			),
		);

		const result = await newClient().actions.rpcAction({ action: 'custom_action' });

		expect(isBinaryDownloadResult(result)).toBe(false);
		expect(result).toMatchObject({ data: { ok: true } });
	});

	it('throws StackOneAPIError (not SyntaxError) for a non-JSON error response', async () => {
		// A gateway/proxy error often returns a non-JSON body (e.g. HTML). The content-type branch
		// must not let response.json() throw a raw SyntaxError - surface a StackOneAPIError instead.
		server.use(
			http.post(
				`${TEST_BASE_URL}/actions/rpc`,
				() =>
					new HttpResponse('<html><body>502 Bad Gateway</body></html>', {
						status: 502,
						headers: { 'content-type': 'text/html' },
					}),
			),
		);

		await expect(
			newClient().actions.rpcAction({ action: 'googledrive_unified_download_file' }),
		).rejects.toThrow(StackOneAPIError);
	});
});
