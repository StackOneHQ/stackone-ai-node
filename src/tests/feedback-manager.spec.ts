import { afterEach, describe, expect, it, spyOn } from 'bun:test';
import { configureImplicitFeedback } from '../feedback';
import { StackOneTool } from '../tool';
import { StackOneToolSet } from '../toolsets';

function requireApiKey(): string {
  const apiKey = process.env.STACKONE_API_KEY;
  if (!apiKey) {
    throw new Error('STACKONE_API_KEY must be set for feedback integration tests');
  }
  return apiKey;
}

function findToolWithoutRequiredParams(): StackOneTool {
  const toolset = new StackOneToolSet();
  const tools = toolset.getStackOneTools();

  for (const tool of tools) {
    const required = tool.parameters.required ?? [];
    if (required.length === 0 && tool instanceof StackOneTool) {
      return tool;
    }
  }

  throw new Error('Expected at least one StackOne tool without required parameters');
}

describe('Implicit feedback integration', () => {
  const apiKey = requireApiKey();
  const tool = findToolWithoutRequiredParams();

  afterEach(() => {
    configureImplicitFeedback({ enabled: false, langsmith: { enabled: false } });
  });

  it('records tool execution snapshots when feedback is enabled', async () => {
    const manager = configureImplicitFeedback({ enabled: true, langsmith: { enabled: false } });
    const recordSpy = spyOn(manager, 'recordToolCall');

    const result = await tool.execute({}, { dryRun: true });

    const expectedAuth = `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`;
    expect(result.headers.Authorization).toBe(expectedAuth);

    expect(recordSpy).toHaveBeenCalledTimes(1);
    const snapshot = recordSpy.mock.calls[0][0];
    expect(snapshot.toolName).toBe(tool.name);
    expect(snapshot.parameters).toEqual({});
    expect(snapshot.success).toBe(true);
    expect(snapshot.rawResult).toEqual(result);
    expect(snapshot.callContext.query).toBeUndefined();

    recordSpy.mockRestore();
  });

  it('does not record execution when feedback is disabled', async () => {
    const manager = configureImplicitFeedback({ enabled: false, langsmith: { enabled: false } });
    const recordSpy = spyOn(manager, 'recordToolCall');

    await tool.execute({}, { dryRun: true });

    expect(manager.isEnabled()).toBe(false);
    expect(recordSpy).not.toHaveBeenCalled();

    recordSpy.mockRestore();
  });
});
