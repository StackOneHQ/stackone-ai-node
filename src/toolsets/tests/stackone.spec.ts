import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import { env } from 'bun';
import { OpenAPILoader } from '../../openapi/loader';
import { StackOneToolSet } from '../stackone';

// Mock environment variables
env.STACKONE_API_KEY = 'test_key';

describe('StackOneToolSet', () => {
  // Clean up all mocks after each test
  afterEach(() => {
    mock.restore();
  });

  beforeEach(() => {
    // Mock the OpenAPILoader.loadFromDirectory method to return an empty object
    spyOn(OpenAPILoader, 'loadFromDirectory').mockImplementation(() => ({}));
  });

  it('should initialize with API key from constructor', () => {
    const toolset = new StackOneToolSet({ apiKey: 'custom_key' });
    expect(toolset).toBeDefined();
  });

  it('should initialize with API key from environment', () => {
    const toolset = new StackOneToolSet();
    expect(toolset).toBeDefined();
  });

  it('should warn if no API key is provided', () => {
    // Temporarily remove environment variable
    const originalKey = env.STACKONE_API_KEY;
    env.STACKONE_API_KEY = undefined;

    // Mock console.warn
    const originalWarn = console.warn;
    let warningCalled = false;
    console.warn = () => {
      warningCalled = true;
    };

    const toolset = new StackOneToolSet();
    expect(toolset).toBeDefined();
    expect(warningCalled).toBe(true);

    // Restore environment variable and console.warn
    env.STACKONE_API_KEY = originalKey;
    console.warn = originalWarn;
  });

  it('should set API key in headers', () => {
    const toolset = new StackOneToolSet({ apiKey: 'custom_key' });

    // @ts-expect-error - Accessing protected property for testing
    expect(toolset.headers['x-api-key']).toBe('custom_key');
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
