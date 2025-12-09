import { StackOneAPIError } from './utils/errors';
import { RpcClient } from './rpc-client';

describe('actions.rpcAction', () => {
  it('should successfully execute an RPC action', async () => {
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

  it('should send correct payload structure', async () => {
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

    expect(response.actionsRpcResponse).toBeDefined();
    const data = response.actionsRpcResponse as {
      data: {
        action: string;
        received: {
          body: Record<string, unknown>;
          headers: Record<string, string>;
          path: Record<string, string>;
          query: Record<string, string>;
        };
      };
    };
    expect(data.data.action).toBe('custom_action');
    expect(data.data.received.body).toEqual({ key: 'value' });
    expect(data.data.received.headers).toEqual({ 'x-custom': 'header' });
    expect(data.data.received.path).toEqual({ id: '123' });
    expect(data.data.received.query).toEqual({ filter: 'active' });
  });

  it('should handle list actions', async () => {
    const client = new RpcClient({
      security: { username: 'test-api-key' },
    });

    const response = await client.actions.rpcAction({
      action: 'hris_list_employees',
    });

    expect(response.actionsRpcResponse).toBeDefined();
    const data = response.actionsRpcResponse as { data: Array<{ id: string; name: string }> };
    expect(data.data).toHaveLength(2);
    expect(data.data[0]).toHaveProperty('id');
    expect(data.data[0]).toHaveProperty('name');
  });

  it('should throw StackOneAPIError on server error', async () => {
    const client = new RpcClient({
      security: { username: 'test-api-key' },
    });

    await expect(
      client.actions.rpcAction({
        action: 'test_error_action',
      })
    ).rejects.toThrow(StackOneAPIError);
  });

  it('should include request body in error for debugging', async () => {
    const client = new RpcClient({
      security: { username: 'test-api-key' },
    });

    try {
      await client.actions.rpcAction({
        action: 'test_error_action',
        body: { debug: 'data' },
      });
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(StackOneAPIError);
      const apiError = error as StackOneAPIError;
      expect(apiError.statusCode).toBe(500);
      expect(apiError.requestBody).toBeDefined();
      expect(apiError.requestBody).toHaveProperty('action', 'test_error_action');
    }
  });

  it('should work with only action parameter', async () => {
    const client = new RpcClient({
      security: { username: 'test-api-key' },
    });

    const response = await client.actions.rpcAction({
      action: 'simple_action',
    });

    expect(response.actionsRpcResponse).toBeDefined();
  });
});
