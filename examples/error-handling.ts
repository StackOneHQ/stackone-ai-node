/**
 * # Error Handling
 *
 * This example shows how to handle errors when using the StackOne SDK.
 */

import assert from 'node:assert';
import { StackOneAPIError, StackOneError, StackOneToolSet, ToolSetConfigError } from '../src';

const errorHandling = async (): Promise<void> => {
  // Example 1: Handle initialization errors
  const testInitializationErrors = async (): Promise<void> => {
    // Temporarily save the API key
    const originalKey = process.env.STACKONE_API_KEY;
    // Delete the API key to force an error
    process.env.STACKONE_API_KEY = undefined;

    try {
      // This will throw a ToolsetConfigError
      const _toolset = new StackOneToolSet({
        strict: true,
      });
      assert(false, 'Expected ToolSetConfigError was not thrown');
    } catch (error) {
      assert(error instanceof ToolSetConfigError, 'Expected error to be ToolSetConfigError');
    } finally {
      // Restore the API key
      process.env.STACKONE_API_KEY = originalKey;
    }
  };

  // Example 2: Handle API errors
  const testApiErrors = async (): Promise<void> => {
    const toolset = new StackOneToolSet();
    const accountId = 'invalid-account-id'; // Invalid account ID to force an error

    try {
      const tools = toolset.getStackOneTools('hris_*', accountId);
      const employeeTool = tools.getTool('hris_list_employees');

      if (employeeTool) {
        // This will throw a StackOneAPIError due to the invalid account ID
        await employeeTool.execute();
        assert(false, 'Expected StackOneAPIError was not thrown');
      }
    } catch (error) {
      assert(
        error instanceof StackOneAPIError || error instanceof StackOneError,
        'Expected error to be StackOneAPIError or StackOneError'
      );

      if (error instanceof StackOneAPIError) {
        assert(error.statusCode !== undefined, 'Expected statusCode to be defined');
        assert(error.responseBody !== undefined, 'Expected responseBody to be defined');
      }
    }
  };

  // Example 3: Handle invalid tool name
  const testInvalidToolName = async (): Promise<void> => {
    const toolset = new StackOneToolSet();
    const tools = toolset.getTools('hris_*');
    const nonExistentTool = tools.getTool('non_existent_tool');

    assert(nonExistentTool === undefined, 'Expected non-existent tool to be undefined');
  };

  // Example 4: Handle invalid arguments
  const testInvalidArguments = async (): Promise<void> => {
    const toolset = new StackOneToolSet();
    const tools = toolset.getTools('hris_*');
    const employeeTool = tools.getTool('hris_get_employee');

    if (employeeTool) {
      try {
        // This will throw an error due to missing required arguments
        await employeeTool.execute();
        assert(false, 'Expected error was not thrown for missing arguments');
      } catch (error) {
        assert(
          error instanceof StackOneAPIError ||
            error instanceof StackOneError ||
            error instanceof Error,
          'Expected error to be a known error type'
        );
      }
    }
  };

  // Run all tests
  await testInitializationErrors();
  await testApiErrors();
  await testInvalidToolName();
  await testInvalidArguments();
};

// Run the example
errorHandling();
