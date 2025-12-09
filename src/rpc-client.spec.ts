import { RpcClient } from './rpc-client';
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

  expect(response.actionsRpcResponse).toBeDefined();
  expect(response.actionsRpcResponse).toHaveProperty('data');
});

test('should send correct payload structure', async () => {
  const client = new RpcClient({
    security: { username: 'test-api-key' },
  });

  const response = await client.actions.rpcAction({
    action: 'custom_action',
    body: { key: 'value' },
    headers: { 'x-custom': 'header' },
    path: { id: '123' },
    query: { filter: 'active' },
  });

  expect(response.actionsRpcResponse).toMatchObject({
    data: {
      action: 'custom_action',
      received: {
        body: { key: 'value' },
        headers: { 'x-custom': 'header' },
        path: { id: '123' },
        query: { filter: 'active' },
      },
    },
  });
});

test('should handle list actions', async () => {
  const client = new RpcClient({
    security: { username: 'test-api-key' },
  });

  const response = await client.actions.rpcAction({
    action: 'hris_list_employees',
  });

  expect(response.actionsRpcResponse).toMatchObject({
    data: [
      { id: expect.any(String), name: expect.any(String) },
      { id: expect.any(String), name: expect.any(String) },
    ],
  });
});

test('should throw StackOneAPIError on server error', async () => {
  const client = new RpcClient({
    security: { username: 'test-api-key' },
  });

  await expect(
    client.actions.rpcAction({
      action: 'test_error_action',
    })
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
    })
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

  expect(response.actionsRpcResponse).toBeDefined();
});
