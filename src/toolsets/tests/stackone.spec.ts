import { describe, expect, it } from 'bun:test';
import { env } from 'bun';
import { ToolSetConfigError } from '../base';
import { StackOneToolSet } from '../stackone';

// Mock environment variables
env.STACKONE_API_KEY = 'test_key';
env.STACKONE_ACCOUNT_ID = undefined;

describe('StackOneToolSet', () => {
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

    it('should combine authentication and account ID headers', () => {
      const toolset = new StackOneToolSet({
        apiKey: 'custom_key',
        accountId: 'test_account',
      });

      // @ts-expect-error - Accessing protected property for testing
      const expectedAuthValue = `Basic ${Buffer.from('custom_key:').toString('base64')}`;
      // @ts-expect-error - Accessing protected property for testing
      expect(toolset.headers.Authorization).toBe(expectedAuthValue);
      // @ts-expect-error - Accessing protected property for testing
      expect(toolset.headers['x-account-id']).toBe('test_account');
    });
  });

  it('should initialise with API key from constructor', () => {
    const toolset = new StackOneToolSet({ apiKey: 'custom_key' });

    expect(toolset).toBeDefined();
    // @ts-expect-error - Accessing protected property for testing
    expect(toolset.authentication?.credentials?.username).toBe('custom_key');
  });

  it('should initialise with API key from environment', () => {
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

    // Verify account ID is stored in the headers
    // @ts-expect-error - Accessing protected property for testing
    expect(toolset.headers['x-account-id']).toBe('test_account');
  });

  it('should allow setting account IDs via setAccounts', () => {
    const toolset = new StackOneToolSet({ apiKey: 'custom_key' });

    const result = toolset.setAccounts(['account-1', 'account-2']);

    // Should return this for chaining
    expect(result).toBe(toolset);
    // @ts-expect-error - Accessing private property for testing
    expect(toolset.accountIds).toEqual(['account-1', 'account-2']);
  });

  it('should set baseUrl from config', () => {
    const toolset = new StackOneToolSet({
      apiKey: 'custom_key',
      baseUrl: 'https://api.example.com',
    });

    // @ts-expect-error - Accessing protected property for testing
    expect(toolset.baseUrl).toBe('https://api.example.com');
  });
});
