import { createServer, type Server as NetServer, type Socket } from 'node:net';
import { StreamableHTTPError } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { http, HttpResponse } from 'msw';
import { TEST_BASE_URL } from '../mocks/constants';
import { createMcpApp } from '../mocks/mcp-server';
import { server } from '../mocks/node';
import { USER_AGENT } from './consts';
import { buildRequestHeaders } from './headers';
import { callMcpTool, describeMcpFailure, listMcpTools, parseToolResult } from './mcp-client';
import { StackOneAPIError } from './utils/error-stackone-api';
import { ToolSetConfigError, ToolSetLoadError } from './utils/error-toolset';

const endpoint = `${TEST_BASE_URL}/mcp?param-style=flat_prefixed`;
const requestFor = (accountId?: string, timeout = 5_000) => ({
	endpoint,
	headers: buildRequestHeaders({ apiKey: 'test-key', accountId }),
	timeout,
});

describe('listMcpTools', () => {
	it('lists every tool, following pagination', async () => {
		const pages = [
			{ tools: [{ name: 'tool_1', inputSchema: { type: 'object' } }], nextCursor: 'page-2' },
			{ tools: [{ name: 'tool_2', inputSchema: { type: 'object' } }] },
		];
		const cursors: unknown[] = [];
		server.use(
			http.post(`${TEST_BASE_URL}/mcp`, async ({ request }) => {
				const message = (await request.json()) as {
					id?: number;
					method: string;
					params?: { cursor?: string };
				};
				if (message.method === 'initialize') {
					return HttpResponse.json({
						jsonrpc: '2.0',
						id: message.id,
						result: {
							protocolVersion: '2025-06-18',
							capabilities: { tools: {} },
							serverInfo: { name: 'paged', version: '1' },
						},
					});
				}
				if (message.method === 'tools/list') {
					cursors.push(message.params?.cursor);
					const page = message.params?.cursor === 'page-2' ? pages[1] : pages[0];
					return HttpResponse.json({ jsonrpc: '2.0', id: message.id, result: page });
				}
				return new HttpResponse(null, { status: 202 });
			}),
		);

		const tools = await listMcpTools(requestFor('acc1'));

		expect(tools.map((tool) => tool.name)).toEqual(['tool_1', 'tool_2']);
		expect(cursors).toEqual([undefined, 'page-2']);
	});

	it('sends the credentials, the account and a version-bearing User-Agent', async () => {
		const seen: Headers[] = [];
		const app = createMcpApp({ accountTools: { acc1: [] } });
		server.use(
			http.all(`${TEST_BASE_URL}/mcp`, ({ request }) => {
				seen.push(request.headers);
				return app.fetch(request);
			}),
		);

		await listMcpTools(requestFor('acc1'));

		expect(seen.length).toBeGreaterThan(0);
		for (const headers of seen) {
			expect(headers.get('x-account-id')).toBe('acc1');
			expect(headers.get('user-agent')).toBe(USER_AGENT);
			expect(headers.get('authorization')).toMatch(/^Basic /);
		}
	});

	it('surfaces an unscoped request as a 400 StackOneAPIError', async () => {
		const error = (await listMcpTools(requestFor(undefined)).catch(
			(caught: unknown) => caught,
		)) as StackOneAPIError;

		expect(error).toBeInstanceOf(StackOneAPIError);
		expect(error.statusCode).toBe(400);
		expect(error.message).toContain('x-account-id');
	});

	// A dead account answers 412 with the reason in the body. The transport's own error buries
	// the status in "Streamable HTTP error: Error POSTing to endpoint: …"; the caller needs it.
	it('unwraps a transport HTTP failure into a StackOneAPIError with status and body', async () => {
		server.use(
			http.post(`${TEST_BASE_URL}/mcp`, () =>
				HttpResponse.json({ message: 're-link the account to resume' }, { status: 412 }),
			),
		);

		const error = (await listMcpTools(requestFor('acc1')).catch(
			(caught: unknown) => caught,
		)) as StackOneAPIError;

		expect(error).toBeInstanceOf(StackOneAPIError);
		expect(error.statusCode).toBe(412);
		expect(error.responseBody).toEqual({ message: 're-link the account to resume' });
		expect(error.message).toBe(
			`MCP request to ${endpoint} failed with 412 Precondition Failed: {"message":"re-link the account to resume"}`,
		);
	});
});

describe('describeMcpFailure', () => {
	it('passes SDK errors through untouched', () => {
		const original = new ToolSetConfigError('already descriptive');
		expect(describeMcpFailure(original, endpoint, 1)).toBe(original);
	});

	it('reports the innermost cause, not the wrapper', () => {
		const wrapped = new Error('outer', { cause: new TypeError('fetch failed: no route') });
		const error = describeMcpFailure(wrapped, endpoint, 1);

		expect(error).toBeInstanceOf(ToolSetLoadError);
		expect(error.message).toBe(
			`MCP request to ${endpoint} failed: TypeError: fetch failed: no route`,
		);
	});

	it('keeps a non-JSON body as text', () => {
		const error = describeMcpFailure(
			new StreamableHTTPError(503, 'Error POSTing to endpoint: upstream down'),
			endpoint,
			1,
		) as StackOneAPIError;

		expect(error.statusCode).toBe(503);
		expect(error.responseBody).toBe('upstream down');
	});
});

describe('parseToolResult', () => {
	it('parses the text content as JSON', () => {
		expect(
			parseToolResult(
				{ content: [{ type: 'text', text: '{"actions":[{"action_id":"linear_list_comments"}]}' }] },
				't',
			),
		).toEqual({ actions: [{ action_id: 'linear_list_comments' }] });
	});

	it('wraps non-object and non-JSON text as { result }', () => {
		expect(parseToolResult({ content: [{ type: 'text', text: '[1,2]' }] }, 't')).toEqual({
			result: [1, 2],
		});
		expect(parseToolResult({ content: [{ type: 'text', text: 'plain' }] }, 't')).toEqual({
			result: 'plain',
		});
	});

	it('falls back to structuredContent when there is no text', () => {
		expect(parseToolResult({ content: [], structuredContent: { ok: true } }, 't')).toEqual({
			ok: true,
		});
	});

	it('keeps non-text parts rather than dropping them', () => {
		const image = { type: 'image', data: 'AAAA', mimeType: 'image/png' };
		expect(parseToolResult({ content: [{ type: 'text', text: '{"a":1}' }, image] }, 't')).toEqual({
			a: 1,
			content_parts: [image],
		});
	});

	describe('the server’s success wrapper', () => {
		const served = (structuredContent: Record<string, unknown>) => ({
			content: [{ type: 'text', text: JSON.stringify(structuredContent) }],
			structuredContent,
		});

		// The server wraps every action tool, execute and feedback as { isError: false, result },
		// with defender and policy metadata beside it. That is returned exactly as written.
		it('returns { isError: false, result, ...metadata } as the server wrote it', () => {
			const payload = {
				isError: false,
				result: { data: { id: 'e1' } },
				defenderMetadata: { applied: true },
				policyMetadata: { decision: 'allow' },
			};
			expect(parseToolResult(served(payload), 't')).toEqual(payload);
		});

		it('returns the same object when the wrapper is only in structuredContent', () => {
			const payload = { isError: false, result: [1] };
			expect(parseToolResult({ content: [], structuredContent: payload }, 't')).toEqual(payload);
		});

		it('never writes content_parts into the caller’s structuredContent', () => {
			const structuredContent = { ok: true };
			const image = { type: 'image', data: 'AAAA', mimeType: 'image/png' };
			parseToolResult({ content: [image], structuredContent }, 't');
			expect(structuredContent).toEqual({ ok: true });
		});
	});

	// A failed tools/call is an ordinary response with isError set. Returning its body as data
	// would hand the caller an error as though it were a success.
	it('raises on isError, with the status from the payload', () => {
		let caught: unknown;
		try {
			parseToolResult(
				{
					isError: true,
					content: [
						{ type: 'text', text: '{"error":"Lambda execution failed","status_code":502}' },
					],
				},
				'linear_execute_action',
			);
		} catch (error) {
			caught = error;
		}

		expect(caught).toBeInstanceOf(StackOneAPIError);
		expect((caught as StackOneAPIError).message).toContain('Lambda execution failed');
		expect((caught as StackOneAPIError).statusCode).toBe(502);
	});

	it.each([
		[{ statusCode: 409 }, 409],
		[{ error: { status_code: 429 } }, 429],
		[{ data: { statusCode: 404 } }, 404],
		[{ result: { status_code: 500 } }, 500],
		[{ status_code: true }, 0],
		[{ message: 'no status' }, 0],
	])('reads the status from %j', (payload, status) => {
		expect(() =>
			parseToolResult(
				{ isError: true, content: [{ type: 'text', text: JSON.stringify(payload) }] },
				't',
			),
		).toThrow(expect.objectContaining({ statusCode: status }) as Error);
	});
});

describe('callMcpTool', () => {
	it('calls the tool and returns its parsed result', async () => {
		const app = createMcpApp({ accountTools: { acc1: [] }, submitFeedback: true });
		server.use(http.all(`${TEST_BASE_URL}/mcp`, ({ request }) => app.fetch(request)));

		const result = await callMcpTool(requestFor('acc1'), 'stackone_submit_feedback', {
			rating: 'positive',
			tool_names: ['x'],
			session_id: 's-1',
		});

		expect(result).toMatchObject({
			isError: false,
			result: { message: 'Feedback recorded', session_id: 's-1' },
		});
	});
});

describe('MCP timeouts', () => {
	let silent: NetServer;
	const sockets: Socket[] = [];
	let port = 0;

	beforeAll(async () => {
		// Accepts the connection and never answers. The MCP client's own defaults would hold this
		// open for far longer than the toolset's timeout.
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

	const silentRequest = () => ({
		endpoint: `http://127.0.0.1:${port}/mcp`,
		headers: buildRequestHeaders({ apiKey: 'k', accountId: 'a' }),
		timeout: 300,
	});

	it('bounds a listing by the timeout', async () => {
		const started = Date.now();
		const error = await listMcpTools(silentRequest()).catch((caught: unknown) => caught);

		expect(error).toBeInstanceOf(ToolSetLoadError);
		expect((error as Error).message).toBe(
			`MCP request to http://127.0.0.1:${port}/mcp timed out after 0.3s`,
		);
		expect(Date.now() - started).toBeLessThan(5_000);
	});

	it('bounds a tools/call by the timeout', async () => {
		const started = Date.now();
		const error = await callMcpTool(silentRequest(), 'any', {}).catch((caught: unknown) => caught);

		expect(error).toBeInstanceOf(ToolSetLoadError);
		expect(Date.now() - started).toBeLessThan(5_000);
	});
});
