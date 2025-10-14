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
      tool.execute({ feedback: 'Great tools!', toolNames: ['test_tool'] })
    ).rejects.toBeInstanceOf(StackOneError);
  });

  it('throws when toolNames is missing', async () => {
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
        toolNames: ['hris_get_employee', ' crm_update_employee '],
        account_id: 'acc_123456',
      },
      { dryRun: true }
    )) as {
      url: string;
      method: string;
      headers: Record<string, string>;
      body: Record<string, unknown>;
    };

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.url).toBe('https://api.stackone.com/ai/tool-feedback');
    expect(result.method).toBe('POST');
    expect(result.body.account_id).toBe('acc_123456');
    expect(result.body.tool_names).toEqual(['hris_get_employee', 'crm_update_employee']);
    expect(result.body.feedback).toBe('Great tools!');
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

    const result = (await tool.execute({
      feedback: 'Great tools!',
      account_id: 'acc_123456',
      toolNames: ['data_export', 'analytics'],
    })) as {
      message: string;
      key: string;
      submitted_at: string;
      trace_id: string;
    };

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [calledUrl, options] = fetchSpy.mock.calls[0];
    expect(calledUrl).toBe('https://api.stackone.com/ai/tool-feedback');
    expect(options).toMatchObject({ method: 'POST' });
    expect(result.message).toBe('Feedback successfully stored');
    expect(result.key).toBe('2025-10-08T11-44-16.123Z-a3f7b2c1d4e5f6a7b8c9d0e1f2a3b4c5.json');
    expect(result.submitted_at).toBe('2025-10-08T11:44:16.123Z');
    expect(result.trace_id).toBe('30d37876-cb1a-4138-9225-197355e0b6c9');
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
        toolNames: ['test_tool'],
      })
    ).rejects.toBeInstanceOf(StackOneError);

    fetchSpy.mockRestore();
  });

  it('uses custom baseUrl when provided', async () => {
    const tool = createFeedbackTool({ baseUrl: 'https://custom.api.com' });
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
      toolNames: ['test_tool'],
    });

    const [calledUrl] = fetchSpy.mock.calls[0];
    expect(calledUrl).toBe('https://custom.api.com/ai/tool-feedback');

    fetchSpy.mockRestore();
  });
});

afterAll(() => {
  // Cleanup
});
