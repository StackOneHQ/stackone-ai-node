import { RpcClient } from './rpc-client';
import { stackOneHeadersSchema } from './schemas/headers';
import { StackOneAPIError } from './utils/errors';

test('should successfully execute an RPC action', async () => {
	const client = new RpcClient({
		security: { username: 'test-api-key' },
	});

	const response = await client.actions.rpcAction({
		action: 'hris_get_employee',
		body: { fields: 'name,email' },
		path: { id: 'emp-123' },
	});

	// Response matches server's ActionsRpcResponseApiModel structure
	expect(response).toHaveProperty('data');
	expect(response.data).toMatchObject({
		id: 'emp-123',
		name: 'Test Employee',
	});
});

test('should send correct payload structure', async () => {
	const client = new RpcClient({
		security: { username: 'test-api-key' },
	});

	const response = await client.actions.rpcAction({
		action: 'custom_action',
		body: { key: 'value' },
		headers: stackOneHeadersSchema.parse({ 'x-custom': 'header' }),
		path: { id: '123' },
		query: { filter: 'active' },
	});

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
		security: { username: 'test-api-key' },
	});

	const response = await client.actions.rpcAction({
		action: 'hris_list_employees',
	});

	// Response data can be an array (matches RpcActionResponseData union type)
	expect(Array.isArray(response.data)).toBe(true);
	expect(response.data).toMatchObject([
		{ id: expect.any(String), name: expect.any(String) },
		{ id: expect.any(String), name: expect.any(String) },
	]);
});

test('should throw StackOneAPIError on server error', async () => {
	const client = new RpcClient({
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
		security: { username: 'test-api-key' },
	});

	const response = await client.actions.rpcAction({
		action: 'test_account_id_header',
		headers: stackOneHeadersSchema.parse({ 'x-account-id': 'test-account-123' }),
	});

	// Verify x-account-id is sent both as HTTP header and in request body
	expect(response.data).toMatchObject({
		httpHeader: 'test-account-123',
		bodyHeader: 'test-account-123',
	});
});
