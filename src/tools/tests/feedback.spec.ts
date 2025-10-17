import { afterAll, beforeEach, describe, expect, it, spyOn } from 'bun:test';
import { StackOneError } from '../../utils/errors';
import { createFeedbackTool } from '../feedback';

beforeEach(() => {
  // Clear any mocks before each test
});

describe('meta_collect_tool_feedback', () => {
  it('throws when account_id is missing', async () => {
    const tool = createFeedbackTool();

    await expect(
      tool.execute({ feedback: 'Great tools!', tool_names: ['test_tool'] })
    ).rejects.toBeInstanceOf(StackOneError);
  });

  it('throws when tool_names is missing', async () => {
    const tool = createFeedbackTool();

    await expect(
      tool.execute({ feedback: 'Great tools!', account_id: 'acc_123456' })
    ).rejects.toBeInstanceOf(StackOneError);
  });

  it('returns dryRun payload without calling fetch', async () => {
    const tool = createFeedbackTool();
    const fetchSpy = spyOn(globalThis, 'fetch');

    const result = (await tool.execute(
      {
        feedback: 'Great tools!',
        tool_names: ['hris_get_employee', ' crm_update_employee '],
        account_id: 'acc_123456',
      },
      { dryRun: true }
    )) as {
      multiple_requests: Array<{
        url: string;
        method: string;
        headers: Record<string, string>;
        body: Record<string, unknown>;
      }>;
      total_accounts: number;
    };

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.total_accounts).toBe(1);
    expect(result.multiple_requests).toHaveLength(1);
    expect(result.multiple_requests[0].url).toBe('https://api.stackone.com/ai/tool-feedback');
    expect(result.multiple_requests[0].method).toBe('POST');
    expect(result.multiple_requests[0].body.account_id).toBe('acc_123456');
    expect(result.multiple_requests[0].body.tool_names).toEqual([
      'hris_get_employee',
      'crm_update_employee',
    ]);
    expect(result.multiple_requests[0].body.feedback).toBe('Great tools!');
    fetchSpy.mockRestore();
  });

  it('submits feedback to the StackOne API endpoint', async () => {
    const tool = createFeedbackTool();
    const apiResponse = {
      message: 'Feedback successfully stored',
      key: '2025-10-08T11-44-16.123Z-a3f7b2c1d4e5f6a7b8c9d0e1f2a3b4c5.json',
      submitted_at: '2025-10-08T11:44:16.123Z',
      trace_id: '30d37876-cb1a-4138-9225-197355e0b6c9',
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

  it('handles API errors', async () => {
    const tool = createFeedbackTool();
    const errorResponse = new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
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

  it('uses custom baseUrl when provided', async () => {
    const tool = createFeedbackTool(undefined, undefined, 'https://custom.api.com');
    const apiResponse = {
      message: 'Feedback successfully stored',
      key: 'test-key.json',
      submitted_at: '2025-10-08T11:44:16.123Z',
      trace_id: 'test-trace-id',
    };
    const response = new Response(JSON.stringify(apiResponse), { status: 200 });
    const fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(response);

    await tool.execute({
      feedback: 'Great tools!',
      account_id: 'acc_123456',
      tool_names: ['test_tool'],
    });

    const [calledUrl] = fetchSpy.mock.calls[0];
    expect(calledUrl).toBe('https://custom.api.com/ai/tool-feedback');

    fetchSpy.mockRestore();
  });

  describe('multiple account IDs', () => {
    it('accepts single account ID as string', async () => {
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

    it('accepts multiple account IDs as array', async () => {
      const tool = createFeedbackTool();
      const apiResponse = {
        message: 'Feedback successfully stored',
        key: 'test-key.json',
        submitted_at: '2025-10-08T11:44:16.123Z',
        trace_id: 'test-trace-id',
      };

      const fetchSpy = spyOn(globalThis, 'fetch').mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify(apiResponse), { status: 200 }))
      );

      const result = await tool.execute({
        feedback: 'Great tools!',
        account_id: ['acc_123456', 'acc_789012'],
        tool_names: ['test_tool'],
      });

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(result).toMatchObject({
        message: 'Feedback sent to 2 account(s)',
        total_accounts: 2,
        successful: 2,
        failed: 0,
      });

      // Verify each account received the feedback
      const calls = fetchSpy.mock.calls;
      expect(calls[0][1]?.body).toContain('"account_id":"acc_123456"');
      expect(calls[1][1]?.body).toContain('"account_id":"acc_789012"');

      fetchSpy.mockRestore();
    });

    it('handles mixed success and failure for multiple accounts', async () => {
      const tool = createFeedbackTool();

      const fetchSpy = spyOn(globalThis, 'fetch')
        .mockImplementationOnce(() =>
          Promise.resolve(new Response(JSON.stringify({ message: 'Success' }), { status: 200 }))
        )
        .mockImplementationOnce(() =>
          Promise.resolve(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }))
        );

      const result = await tool.execute({
        feedback: 'Great tools!',
        account_id: ['acc_123456', 'acc_789012'],
        tool_names: ['test_tool'],
      });

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(result).toMatchObject({
        message: 'Feedback sent to 2 account(s)',
        total_accounts: 2,
        successful: 1,
        failed: 1,
      });

      expect(result.results).toHaveLength(2);
      const successResult = result.results.find(
        (r: { account_id: string }) => r.account_id === 'acc_123456'
      );
      const errorResult = result.results.find(
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

      fetchSpy.mockRestore();
    });

    it('throws error when all submissions fail', async () => {
      const tool = createFeedbackTool();
      const fetchSpy = spyOn(globalThis, 'fetch').mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }))
      );

      await expect(
        tool.execute({
          feedback: 'Great tools!',
          account_id: ['acc_123456', 'acc_789012'],
          tool_names: ['test_tool'],
        })
      ).rejects.toBeInstanceOf(StackOneError);

      fetchSpy.mockRestore();
    });

    it('shows dry run for multiple accounts', async () => {
      const tool = createFeedbackTool();
      const fetchSpy = spyOn(globalThis, 'fetch');

      const result = await tool.execute(
        {
          feedback: 'Great tools!',
          account_id: ['acc_123456', 'acc_789012'],
          tool_names: ['test_tool'],
        },
        { dryRun: true }
      );

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(result).toMatchObject({
        multiple_requests: [
          {
            url: 'https://api.stackone.com/ai/tool-feedback',
            method: 'POST',
            body: {
              feedback: 'Great tools!',
              account_id: 'acc_123456',
              tool_names: ['test_tool'],
            },
          },
          {
            url: 'https://api.stackone.com/ai/tool-feedback',
            method: 'POST',
            body: {
              feedback: 'Great tools!',
              account_id: 'acc_789012',
              tool_names: ['test_tool'],
            },
          },
        ],
        total_accounts: 2,
      });

      fetchSpy.mockRestore();
    });

    it('validates that at least one account ID is provided', async () => {
      const tool = createFeedbackTool();

      await expect(
        tool.execute({
          feedback: 'Great tools!',
          account_id: [],
          tool_names: ['test_tool'],
        })
      ).rejects.toBeInstanceOf(StackOneError);

      await expect(
        tool.execute({
          feedback: 'Great tools!',
          account_id: [''],
          tool_names: ['test_tool'],
        })
      ).rejects.toBeInstanceOf(StackOneError);
    });
  });
});

afterAll(() => {
  // Cleanup
});
