import { afterAll, beforeEach, describe, expect, it, spyOn } from 'bun:test';
import { StackOneError } from '../../utils/errors';
import { createFeedbackTool } from '../feedback';

beforeEach(() => {
  // Clear any mocks before each test
});

describe('meta_collect_tool_feedback', () => {
  describe('validation tests', () => {
    it('test_missing_required_fields', async () => {
      const tool = createFeedbackTool();

      // Test missing account_id
      await expect(
        tool.execute({ feedback: 'Great tools!', tool_names: ['test_tool'] })
      ).rejects.toBeInstanceOf(StackOneError);

      // Test missing tool_names
      await expect(
        tool.execute({ feedback: 'Great tools!', account_id: 'acc_123456' })
      ).rejects.toBeInstanceOf(StackOneError);

      // Test missing feedback
      await expect(
        tool.execute({ account_id: 'acc_123456', tool_names: ['test_tool'] })
      ).rejects.toBeInstanceOf(StackOneError);
    });

    it('test_empty_and_whitespace_validation', async () => {
      const tool = createFeedbackTool();

      // Test empty feedback
      await expect(
        tool.execute({ feedback: '', account_id: 'acc_123456', tool_names: ['test_tool'] })
      ).rejects.toBeInstanceOf(StackOneError);

      // Test whitespace-only feedback
      await expect(
        tool.execute({ feedback: '   ', account_id: 'acc_123456', tool_names: ['test_tool'] })
      ).rejects.toBeInstanceOf(StackOneError);

      // Test empty account_id
      await expect(
        tool.execute({ feedback: 'Great tools!', account_id: '', tool_names: ['test_tool'] })
      ).rejects.toBeInstanceOf(StackOneError);

      // Test empty tool_names list
      await expect(
        tool.execute({ feedback: 'Great tools!', account_id: 'acc_123456', tool_names: [] })
      ).rejects.toBeInstanceOf(StackOneError);

      // Test tool_names with only whitespace
      await expect(
        tool.execute({
          feedback: 'Great tools!',
          account_id: 'acc_123456',
          tool_names: ['   ', '  '],
        })
      ).rejects.toBeInstanceOf(StackOneError);
    });

    it('test_multiple_account_ids_validation', async () => {
      const tool = createFeedbackTool();

      // Test empty account ID list
      await expect(
        tool.execute({
          feedback: 'Great tools!',
          account_id: [],
          tool_names: ['test_tool'],
        })
      ).rejects.toBeInstanceOf(StackOneError);

      // Test list with only empty strings
      await expect(
        tool.execute({
          feedback: 'Great tools!',
          account_id: ['', '   '],
          tool_names: ['test_tool'],
        })
      ).rejects.toBeInstanceOf(StackOneError);
    });

    it('test_json_string_input', async () => {
      const tool = createFeedbackTool();
      const apiResponse = { message: 'Success' };
      const response = new Response(JSON.stringify(apiResponse), { status: 200 });
      const fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(response);

      // Test JSON string input
      const jsonInput = JSON.stringify({
        feedback: 'Great tools!',
        account_id: 'acc_123456',
        tool_names: ['test_tool'],
      });

      const result = await tool.execute(jsonInput);

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({
        message: 'Feedback sent to 1 account(s)',
        total_accounts: 1,
        successful: 1,
        failed: 0,
      });
      fetchSpy.mockRestore();
    });
  });

  describe('execution tests', () => {
    it('test_single_account_execution', async () => {
      const tool = createFeedbackTool();
      const apiResponse = {
        message: 'Feedback successfully stored',
        key: 'test-key.json',
        submitted_at: '2025-10-08T11:44:16.123Z',
        trace_id: 'test-trace-id',
      };
      const response = new Response(JSON.stringify(apiResponse), { status: 200 });
      const fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(response);

      const result = await tool.execute({
        feedback: 'Great tools!',
        account_id: 'acc_123456',
        tool_names: ['data_export', 'analytics'],
      });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [calledUrl, options] = fetchSpy.mock.calls[0];
      expect(calledUrl).toBe('https://api.stackone.com/ai/tool-feedback');
      expect(options).toMatchObject({ method: 'POST' });
      expect(result).toMatchObject({
        message: 'Feedback sent to 1 account(s)',
        total_accounts: 1,
        successful: 1,
        failed: 0,
      });
      expect(result.results[0]).toMatchObject({
        account_id: 'acc_123456',
        status: 'success',
        result: apiResponse,
      });
      fetchSpy.mockRestore();
    });

    it('test_call_method_interface', async () => {
      const tool = createFeedbackTool();
      const apiResponse = { message: 'Success' };
      const response = new Response(JSON.stringify(apiResponse), { status: 200 });
      const fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(response);

      // Test using the tool directly (equivalent to .call() in Python)
      const result = await tool.execute({
        feedback: 'Great tools!',
        account_id: 'acc_123456',
        tool_names: ['test_tool'],
      });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({
        message: 'Feedback sent to 1 account(s)',
        total_accounts: 1,
        successful: 1,
        failed: 0,
      });
      fetchSpy.mockRestore();
    });

    it('test_api_error_handling', async () => {
      const tool = createFeedbackTool();
      const errorResponse = new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
      const fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(errorResponse);

      await expect(
        tool.execute({
          feedback: 'Great tools!',
          account_id: 'acc_123456',
          tool_names: ['test_tool'],
        })
      ).rejects.toBeInstanceOf(StackOneError);

      fetchSpy.mockRestore();
    });

    it('test_multiple_account_ids_execution', async () => {
      const tool = createFeedbackTool();

      // Test all accounts succeed
      const successResponse = { message: 'Success' };
      const fetchSpy = spyOn(globalThis, 'fetch').mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify(successResponse), { status: 200 }))
      );

      const result = await tool.execute({
        feedback: 'Great tools!',
        account_id: ['acc_123456', 'acc_789012', 'acc_345678'],
        tool_names: ['test_tool'],
      });

      expect(fetchSpy).toHaveBeenCalledTimes(3);
      expect(result).toMatchObject({
        message: 'Feedback sent to 3 account(s)',
        total_accounts: 3,
        successful: 3,
        failed: 0,
      });
      fetchSpy.mockRestore();

      // Test mixed success/error scenario
      const mixedFetchSpy = spyOn(globalThis, 'fetch')
        .mockImplementationOnce(() =>
          Promise.resolve(new Response(JSON.stringify({ message: 'Success' }), { status: 200 }))
        )
        .mockImplementationOnce(() =>
          Promise.resolve(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }))
        );

      const mixedResult = await tool.execute({
        feedback: 'Great tools!',
        account_id: ['acc_123456', 'acc_789012'],
        tool_names: ['test_tool'],
      });

      expect(mixedFetchSpy).toHaveBeenCalledTimes(2);
      expect(mixedResult).toMatchObject({
        message: 'Feedback sent to 2 account(s)',
        total_accounts: 2,
        successful: 1,
        failed: 1,
      });

      const successResult = mixedResult.results.find(
        (r: { account_id: string }) => r.account_id === 'acc_123456'
      );
      const errorResult = mixedResult.results.find(
        (r: { account_id: string }) => r.account_id === 'acc_789012'
      );

      expect(successResult).toMatchObject({
        account_id: 'acc_123456',
        status: 'success',
        result: { message: 'Success' },
      });
      expect(errorResult).toMatchObject({
        account_id: 'acc_789012',
        status: 'error',
        error: '{"error":"Unauthorized"}',
      });
      mixedFetchSpy.mockRestore();
    });

    it('test_tool_integration', async () => {
      // Test tool properties
      const tool = createFeedbackTool();
      expect(tool.name).toBe('meta_collect_tool_feedback');
      expect(tool.description).toContain('Collects user feedback');
      expect(tool.parameters).toBeDefined();

      // Test OpenAI function format conversion
      const openaiFormat = tool.toOpenAI();
      expect(openaiFormat).toMatchObject({
        type: 'function',
        function: {
          name: 'meta_collect_tool_feedback',
          description: expect.stringContaining('Collects user feedback'),
          parameters: expect.objectContaining({
            type: 'object',
            properties: expect.objectContaining({
              feedback: expect.any(Object),
              account_id: expect.any(Object),
              tool_names: expect.any(Object),
            }),
          }),
        },
      });
    });
  });

  describe('integration test', () => {
    it('test_live_feedback_submission', async () => {
      // Skip if no API key is available (similar to Python SDK)
      if (!process.env.STACKONE_API_KEY) {
        console.log('Skipping live test - STACKONE_API_KEY not available');
        return;
      }

      const tool = createFeedbackTool();
      const testData = {
        feedback: `Test feedback from Node.js SDK at ${new Date().toISOString()}`,
        account_id: 'test_account_123',
        tool_names: ['test_tool_1', 'test_tool_2'],
      };

      try {
        const result = await tool.execute(testData);
        expect(result).toMatchObject({
          message: 'Feedback sent to 1 account(s)',
          total_accounts: 1,
          successful: 1,
          failed: 0,
        });
        expect(result.results[0]).toMatchObject({
          account_id: 'test_account_123',
          status: 'success',
        });
      } catch (error) {
        // If the test account doesn't exist, that's expected
        expect(error).toBeInstanceOf(StackOneError);
      }
    });
  });
});

afterAll(() => {
  // Cleanup
});
