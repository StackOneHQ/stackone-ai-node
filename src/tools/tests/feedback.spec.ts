import { afterAll, beforeEach, describe, expect, it, spyOn } from 'bun:test';
import { StackOneError } from '../../utils/errors';
import { createFeedbackTool } from '../feedback';

const originalEnv = process.env.STACKONE_FEEDBACK_URL;

beforeEach(() => {
  process.env.STACKONE_FEEDBACK_URL = originalEnv;
});

describe('meta_collect_tool_feedback', () => {
  it('throws when consent is not granted', async () => {
    const tool = createFeedbackTool({ defaultEndpoint: 'https://example.com/feedback' });

    await expect(
      tool.execute({ consentGranted: false, feedback: 'Great tools!', accountId: 'acct-123' })
    ).rejects.toBeInstanceOf(StackOneError);
  });

  it('throws when feedback endpoint is missing', async () => {
    process.env.STACKONE_FEEDBACK_URL = '';
    const tool = createFeedbackTool();

    await expect(
      tool.execute({ consentGranted: true, feedback: 'Great tools!', accountId: 'acct-123' })
    ).rejects.toBeInstanceOf(StackOneError);
  });

  it('throws when accountId is missing', async () => {
    const tool = createFeedbackTool({ defaultEndpoint: 'https://example.com/feedback' });

    await expect(
      tool.execute({ consentGranted: true, feedback: 'Great tools!' })
    ).rejects.toBeInstanceOf(StackOneError);
  });

  it('returns dryRun payload without calling fetch', async () => {
    const tool = createFeedbackTool({ defaultEndpoint: 'https://example.com/feedback' });
    const fetchSpy = spyOn(globalThis, 'fetch');

    const result = (await tool.execute(
      {
        consentGranted: true,
        feedback: 'Great tools!',
        toolNames: ['hris_get_employee', ' crm_update_employee '],
        metadata: { sentiment: 'positive' },
        totalToolsCalled: 4.2,
        toolChronology: [
          {
            toolName: 'hris_get_employee',
            calledAt: ' 2025-01-10T10:00:00Z ',
            notes: 'success ',
            durationMs: 520,
            provider: 'Workday',
          },
          {
            toolName: '',
            calledAt: 'ignored',
          },
        ],
        accountId: 'acct-123',
      },
      { dryRun: true }
    )) as {
      endpoint: string;
      payload: Record<string, unknown>;
    };

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.endpoint).toBe('https://example.com/feedback');
    expect(result.payload.toolNames).toEqual(['hris_get_employee', 'crm_update_employee']);
    expect(result.payload.metadata).toEqual({ sentiment: 'positive' });
    expect(result.payload.totalToolsCalled).toBe(4);
    expect(result.payload.toolChronology).toEqual([
      {
        toolName: 'hris_get_employee',
        calledAt: '2025-01-10T10:00:00Z',
        notes: 'success',
        durationMs: 520,
        provider: 'Workday',
      },
    ]);
    expect(result.payload.accountId).toBe('acct-123');
    expect(result.payload.source).toBe('stackone-ai-node');
    fetchSpy.mockRestore();
  });

  it('submits feedback to the configured endpoint', async () => {
    const tool = createFeedbackTool({ defaultEndpoint: 'https://example.com/feedback' });
    const response = new Response(JSON.stringify({ received: true }), { status: 200 });
    const fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(response);

    const result = (await tool.execute({
      consentGranted: true,
      feedback: 'Great tools!',
      accountId: 'acct-123',
    })) as {
      status: string;
      endpoint: string;
      response: unknown;
    };

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [calledUrl, options] = fetchSpy.mock.calls[0];
    expect(calledUrl).toBe('https://example.com/feedback');
    expect(options).toMatchObject({ method: 'POST' });
    expect(result.status).toBe('submitted');
    expect(result.response).toEqual({ received: true });
    fetchSpy.mockRestore();
  });
});

afterAll(() => {
  process.env.STACKONE_FEEDBACK_URL = originalEnv;
});
