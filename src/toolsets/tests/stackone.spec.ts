import { describe, expect, it, spyOn } from 'bun:test';
import { env } from 'bun';
import { ToolSetConfigError } from '../base';
import { StackOneToolSet } from '../stackone';

// Mock environment variables
env.STACKONE_API_KEY = 'test_key';
env.STACKONE_ACCOUNT_ID = undefined;

describe('StackOneToolSet', () => {
  // Snapshot tests
  describe('Snapshot Tests', () => {
    it('should parse the all the oas files correctly', () => {
      const toolset = new StackOneToolSet();
      const hrisTools = toolset.getStackOneTools('hris_*');

      expect(Object.keys(hrisTools).length).toBeGreaterThan(0);

      expect(hrisTools).toMatchSnapshot();
    });
  });
  describe('Authentication Configuration', () => {
    it('should configure basic auth with API key from constructor', () => {
      const toolset = new StackOneToolSet({ apiKey: 'custom_key' });

      // @ts-expect-error - Accessing protected property for testing
      expect(toolset.authentication).toEqual({
        type: 'basic',
        credentials: {
          username: 'custom_key',
          password: '',
        },
      });
    });

    it('should configure basic auth with API key from environment', () => {
      const toolset = new StackOneToolSet();

      // @ts-expect-error - Accessing protected property for testing
      expect(toolset.authentication).toEqual({
        type: 'basic',
        credentials: {
          username: 'test_key',
          password: '',
        },
      });
    });

    it('should throw ToolSetConfigError if no API key is provided and strict mode is enabled', () => {
      // Temporarily remove environment variable
      const originalKey = env.STACKONE_API_KEY;
      env.STACKONE_API_KEY = undefined;

      expect(() => {
        new StackOneToolSet({ strict: true });
      }).toThrow(ToolSetConfigError);

      // Restore environment variable
      env.STACKONE_API_KEY = originalKey;
    });

    it('should properly apply authentication to tools', () => {
      const toolset = new StackOneToolSet({ apiKey: 'custom_key' });
      const tools = toolset.getStackOneTools();

      // Get a tool and check its headers
      const tool = tools.getTool('hris_get_employee');
      if (!tool) return;

      const headers = tool.getHeaders();
      const expectedAuthValue = `Basic ${Buffer.from('custom_key:').toString('base64')}`;
      expect(headers.Authorization).toBe(expectedAuthValue);
    });

    it('should not override custom headers with authentication', () => {
      const customHeaders = {
        'Custom-Header': 'test-value',
        Authorization: 'Bearer custom-token',
      };

      const toolset = new StackOneToolSet({
        apiKey: 'custom_key',
        headers: customHeaders,
      });

      // @ts-expect-error - Accessing protected property for testing
      expect(toolset.headers).toEqual(customHeaders);
    });

    it('should properly combine authentication and account ID headers', () => {
      const toolset = new StackOneToolSet({
        apiKey: 'custom_key',
        accountId: 'test_account',
      });

      const tools = toolset.getStackOneTools();
      const tool = tools.getTool('hris_get_employee');
      if (!tool) return;

      const headers = tool.getHeaders();
      const expectedAuthValue = `Basic ${Buffer.from('custom_key:').toString('base64')}`;
      expect(headers.Authorization).toBe(expectedAuthValue);
      expect(headers['x-account-id']).toBe('test_account');
    });
  });

  describe('Authentication Headers', () => {
    it('should send correct basic auth header in request', async () => {
      const toolset = new StackOneToolSet({ apiKey: 'custom_key' });
      const tools = toolset.getStackOneTools();
      const tool = tools.getTool('hris_get_employee');
      if (!tool) throw new Error('Tool not found');

      // Use dryRun to check the actual request headers
      const request = (await tool.execute({ id: '123' }, { dryRun: true })) as {
        headers: Record<string, string>;
        url: string;
        method: string;
      };
      const expectedAuthValue = `Basic ${Buffer.from('custom_key:').toString('base64')}`;
      expect(request.headers.Authorization).toBe(expectedAuthValue);
    });

    it('should send correct account ID header in request', async () => {
      const toolset = new StackOneToolSet({
        apiKey: 'custom_key',
        accountId: 'test_account',
      });
      const tools = toolset.getStackOneTools();
      const tool = tools.getTool('hris_get_employee');
      if (!tool) throw new Error('Tool not found');

      // Use dryRun to check the actual request headers
      const request = (await tool.execute({ id: '123' }, { dryRun: true })) as {
        headers: Record<string, string>;
        url: string;
        method: string;
      };
      expect(request.headers['x-account-id']).toBe('test_account');
    });

    it('should override account ID in request when provided to getStackOneTools', async () => {
      const toolset = new StackOneToolSet({
        apiKey: 'custom_key',
        accountId: 'default_account',
      });
      const tools = toolset.getStackOneTools(undefined, 'override_account');
      const tool = tools.getTool('hris_get_employee');
      if (!tool) throw new Error('Tool not found');

      // Use dryRun to check the actual request headers
      const request = (await tool.execute({ id: '123' }, { dryRun: true })) as {
        headers: Record<string, string>;
        url: string;
        method: string;
      };
      expect(request.headers['x-account-id']).toBe('override_account');
    });

    it('should respect custom headers while maintaining auth headers', async () => {
      const customHeaders = {
        'Custom-Header': 'test-value',
      };

      const toolset = new StackOneToolSet({
        apiKey: 'custom_key',
        accountId: 'test_account',
        headers: customHeaders,
      });

      const tools = toolset.getStackOneTools();
      const tool = tools.getTool('hris_get_employee');
      if (!tool) throw new Error('Tool not found');

      // Use dryRun to check the actual request headers
      const request = (await tool.execute({ id: '123' }, { dryRun: true })) as {
        headers: Record<string, string>;
        url: string;
        method: string;
      };
      const expectedAuthValue = `Basic ${Buffer.from('custom_key:').toString('base64')}`;

      expect(request.headers.Authorization).toBe(expectedAuthValue);
      expect(request.headers['x-account-id']).toBe('test_account');
      expect(request.headers['Custom-Header']).toBe('test-value');
    });

    it('should not send account ID header if not provided', async () => {
      const toolset = new StackOneToolSet({ apiKey: 'custom_key' });
      const tools = toolset.getStackOneTools();
      const tool = tools.getTool('hris_get_employee');
      if (!tool) throw new Error('Tool not found');

      // Use dryRun to check the actual request headers
      const request = (await tool.execute({ id: '123' }, { dryRun: true })) as {
        headers: Record<string, string>;
        url: string;
        method: string;
      };
      expect(request.headers['x-account-id']).toBeUndefined();
    });
  });

  it('should initialize with API key from constructor', () => {
    const toolset = new StackOneToolSet({ apiKey: 'custom_key' });

    expect(toolset).toBeDefined();
    // @ts-expect-error - Accessing protected property for testing
    expect(toolset.authentication?.credentials?.username).toBe('custom_key');
  });

  it('should initialize with API key from environment', () => {
    const toolset = new StackOneToolSet();

    expect(toolset).toBeDefined();
    // @ts-expect-error - Accessing protected property for testing
    expect(toolset.authentication?.credentials?.username).toBe('test_key');
  });

  it('should set API key in headers', () => {
    const toolset = new StackOneToolSet({ apiKey: 'custom_key' });

    // @ts-expect-error - Accessing protected property for testing
    expect(toolset.headers.Authorization).toBe('Basic Y3VzdG9tX2tleTo=');
  });

  it('should set account ID in headers if provided', () => {
    const toolset = new StackOneToolSet({
      apiKey: 'custom_key',
      accountId: 'test_account',
    });

    // Verify account ID is stored in the instance
    // @ts-expect-error - Accessing private property for testing
    expect(toolset.accountId).toBe('test_account');

    // The account ID should be applied when getting tools
    // We can't directly check headers here, but we can verify the account ID is used
    // when calling getTools
    const getToolsSpy = spyOn(toolset, 'getTools');
    toolset.getStackOneTools();
    expect(getToolsSpy).toHaveBeenCalledWith(undefined, { 'x-account-id': 'test_account' });
  });

  it('should get tools with account ID override', () => {
    const toolset = new StackOneToolSet({ apiKey: 'custom_key' });

    // Mock the getTools method
    const getToolsSpy = spyOn(toolset, 'getTools');

    // Call getStackOneTools with account ID
    toolset.getStackOneTools('hris_*', 'override_account');

    // Verify getTools was called with the correct parameters
    expect(getToolsSpy).toHaveBeenCalledWith('hris_*', { 'x-account-id': 'override_account' });
  });

  it('should get tools without account ID if not provided', () => {
    const toolset = new StackOneToolSet({ apiKey: 'custom_key' });

    // Mock the getTools method
    const getToolsSpy = spyOn(toolset, 'getTools');

    // Call getStackOneTools without account ID
    toolset.getStackOneTools('hris_*');

    // Verify getTools was called with the correct parameters
    expect(getToolsSpy).toHaveBeenCalledWith('hris_*', {});
  });
});
