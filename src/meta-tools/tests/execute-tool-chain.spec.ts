import { describe, expect, it, mock } from 'bun:test';
import { BaseTool, StackOneTool, Tools } from '../../tool';
import type { ExecuteConfig, JsonDict, ToolParameters } from '../../types';
import { ExecuteToolChain } from '../execute-tool-chain';

// Mock tool creation helper
const createMockTool = (
  name: string,
  description: string,
  mockExecute?: (params: JsonDict) => Promise<JsonDict>
): BaseTool => {
  const params: ToolParameters = {
    type: 'object',
    properties: {
      id: { type: 'string' },
      data: { type: 'object' },
    },
  };

  const executeConfig: ExecuteConfig = {
    method: 'GET',
    url: 'https://api.example.com/test',
    bodyType: 'json',
    params: [],
  };

  const tool = new BaseTool(name, description, params, executeConfig);

  if (mockExecute) {
    tool.execute = mock(mockExecute);
  }

  return tool;
};

// Create StackOne tool for testing account ID handling
const createMockStackOneTool = (
  name: string,
  description: string,
  mockExecute?: (params: JsonDict) => Promise<JsonDict>
): StackOneTool => {
  const params: ToolParameters = {
    type: 'object',
    properties: {
      id: { type: 'string' },
    },
  };

  const executeConfig: ExecuteConfig = {
    method: 'GET',
    url: 'https://api.stackone.com/test',
    bodyType: 'json',
    params: [],
  };

  const tool = new StackOneTool(name, description, params, executeConfig);

  if (mockExecute) {
    tool.execute = mock(mockExecute);
  }

  return tool;
};

describe('ExecuteToolChain', () => {
  describe('Basic functionality', () => {
    it('should execute a simple tool chain', async () => {
      const mockTool1 = createMockTool('tool1', 'First tool', async () => ({
        result: 'value1',
        data: { foo: 'bar' },
      }));

      const mockTool2 = createMockTool('tool2', 'Second tool', async (params) => ({
        received: params,
        result: 'value2',
      }));

      const tools = new Tools([mockTool1, mockTool2]);
      const chain = new ExecuteToolChain(tools);

      const result = await chain.execute({
        steps: [
          {
            toolName: 'tool1',
            parameters: { id: '123' },
          },
          {
            toolName: 'tool2',
            parameters: { id: '456', previous: '{{step0.result.result}}' },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.stepResults).toHaveLength(2);
      expect(result.stepResults[0].success).toBe(true);
      expect(result.stepResults[0].result).toEqual({ result: 'value1', data: { foo: 'bar' } });
      expect(result.stepResults[1].success).toBe(true);
      expect(result.stepResults[1].result.received.previous).toBe('value1');
    });

    it('should handle conditional execution', async () => {
      const mockTool1 = createMockTool('tool1', 'First tool', async () => ({
        shouldContinue: false,
      }));

      const mockTool2 = createMockTool('tool2', 'Second tool', async () => ({
        result: 'should not execute',
      }));

      const tools = new Tools([mockTool1, mockTool2]);
      const chain = new ExecuteToolChain(tools);

      const result = await chain.execute({
        steps: [
          {
            toolName: 'tool1',
            parameters: {},
          },
          {
            toolName: 'tool2',
            parameters: {},
            condition: '{{step0.result.shouldContinue}} === true',
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.stepResults).toHaveLength(2);
      expect(result.stepResults[1].skipped).toBe(true);
      expect(mockTool2.execute).not.toHaveBeenCalled();
    });

    it('should use custom step names', async () => {
      const mockTool = createMockTool('tool1', 'Test tool', async () => ({ result: 'ok' }));
      const tools = new Tools([mockTool]);
      const chain = new ExecuteToolChain(tools);

      const result = await chain.execute({
        steps: [
          {
            toolName: 'tool1',
            parameters: {},
            stepName: 'Custom Step Name',
          },
        ],
      });

      expect(result.stepResults[0].stepName).toBe('Custom Step Name');
    });
  });

  describe('Parameter substitution', () => {
    it('should substitute nested parameters', async () => {
      const mockTool1 = createMockTool('tool1', 'First tool', async () => ({
        data: {
          nested: {
            value: 'deep-value',
          },
        },
      }));

      const mockTool2 = createMockTool('tool2', 'Second tool', async (params) => ({
        received: params,
      }));

      const tools = new Tools([mockTool1, mockTool2]);
      const chain = new ExecuteToolChain(tools);

      const result = await chain.execute({
        steps: [
          {
            toolName: 'tool1',
            parameters: {},
          },
          {
            toolName: 'tool2',
            parameters: {
              value: '{{step0.result.data.nested.value}}',
            },
          },
        ],
      });

      expect(result.stepResults[1].result.received.value).toBe('deep-value');
    });

    it('should handle complex parameter objects', async () => {
      const mockTool1 = createMockTool('tool1', 'First tool', async () => ({
        id: 'abc123',
        name: 'Test Name',
      }));

      const mockTool2 = createMockTool('tool2', 'Second tool', async (params) => ({
        received: params,
      }));

      const tools = new Tools([mockTool1, mockTool2]);
      const chain = new ExecuteToolChain(tools);

      const result = await chain.execute({
        steps: [
          {
            toolName: 'tool1',
            parameters: {},
          },
          {
            toolName: 'tool2',
            parameters: {
              data: {
                id: '{{step0.result.id}}',
                name: '{{step0.result.name}}',
                static: 'static-value',
              },
            },
          },
        ],
      });

      expect(result.stepResults[1].result.received.data).toEqual({
        id: 'abc123',
        name: 'Test Name',
        static: 'static-value',
      });
    });
  });

  describe('Error handling', () => {
    it('should stop on error by default', async () => {
      const mockTool1 = createMockTool('tool1', 'First tool', async () => {
        throw new Error('Tool 1 failed');
      });

      const mockTool2 = createMockTool('tool2', 'Second tool', async () => ({
        result: 'should not execute',
      }));

      const tools = new Tools([mockTool1, mockTool2]);
      const chain = new ExecuteToolChain(tools);

      const result = await chain.execute({
        steps: [
          {
            toolName: 'tool1',
            parameters: {},
          },
          {
            toolName: 'tool2',
            parameters: {},
          },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Tool 1 failed');
      expect(result.stepResults).toHaveLength(1);
      expect(mockTool2.execute).not.toHaveBeenCalled();
    });

    it('should continue on error when specified', async () => {
      const mockTool1 = createMockTool('tool1', 'First tool', async () => {
        throw new Error('Tool 1 failed');
      });

      const mockTool2 = createMockTool('tool2', 'Second tool', async () => ({
        result: 'success',
      }));

      const tools = new Tools([mockTool1, mockTool2]);
      const chain = new ExecuteToolChain(tools);

      const result = await chain.execute({
        steps: [
          {
            toolName: 'tool1',
            parameters: {},
            continueOnError: true,
          },
          {
            toolName: 'tool2',
            parameters: {},
          },
        ],
        stopOnError: false,
      });

      expect(result.success).toBe(false); // Still false because one step failed
      expect(result.stepResults).toHaveLength(2);
      expect(result.stepResults[0].success).toBe(false);
      expect(result.stepResults[1].success).toBe(true);
    });

    it('should handle tool not found', async () => {
      const tools = new Tools([]);
      const chain = new ExecuteToolChain(tools);

      const result = await chain.execute({
        steps: [
          {
            toolName: 'non_existent_tool',
            parameters: {},
          },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Tool not found');
    });

    it('should handle timeout', async () => {
      const mockTool = createMockTool('tool1', 'Slow tool', async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return { result: 'ok' };
      });

      const tools = new Tools([mockTool]);
      const chain = new ExecuteToolChain(tools);

      const result = await chain.execute({
        steps: [
          {
            toolName: 'tool1',
            parameters: {},
          },
        ],
        timeout: 100, // 100ms timeout
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('timed out');
    });
  });

  describe('StackOne tool integration', () => {
    it('should set account ID on StackOne tools', async () => {
      const mockStackOneTool = createMockStackOneTool(
        'stackone_tool',
        'StackOne tool',
        async () => ({
          result: 'ok',
        })
      );

      const setAccountIdSpy = mock((_accountId: string) => mockStackOneTool);
      mockStackOneTool.setAccountId = setAccountIdSpy;

      const tools = new Tools([mockStackOneTool]);
      const chain = new ExecuteToolChain(tools);

      await chain.execute({
        steps: [
          {
            toolName: 'stackone_tool',
            parameters: {},
          },
        ],
        accountId: 'test-account-123',
      });

      expect(setAccountIdSpy).toHaveBeenCalledWith('test-account-123');
    });
  });

  describe('Use case examples', () => {
    it('should handle Jira ticket reading workflow', async () => {
      const getTicket = createMockTool('jira_get_ticket', 'Get Jira ticket', async (params) => ({
        id: params.id,
        title: 'Fix login bug',
        description: 'Users cannot login',
        assignee: 'john.doe',
      }));

      const getUser = createMockTool('jira_get_user', 'Get Jira user', async (params) => ({
        username: params.username,
        email: 'john.doe@example.com',
        name: 'John Doe',
      }));

      const tools = new Tools([getTicket, getUser]);
      const chain = new ExecuteToolChain(tools);

      const result = await chain.execute({
        steps: [
          {
            toolName: 'jira_get_ticket',
            parameters: { id: 'PROJ-123' },
            stepName: 'Fetch ticket details',
          },
          {
            toolName: 'jira_get_user',
            parameters: { username: '{{step0.result.assignee}}' },
            stepName: 'Get assignee details',
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.stepResults[0].result.title).toBe('Fix login bug');
      expect(result.stepResults[1].result.email).toBe('john.doe@example.com');
    });

    it('should handle employee time off creation workflow', async () => {
      const getEmployee = createMockTool('hris_get_employee', 'Get employee', async (params) => ({
        id: params.id,
        name: 'Jane Smith',
        department: 'Engineering',
        manager_id: 'mgr-456',
      }));

      const createTimeOff = createMockTool(
        'hris_create_time_off',
        'Create time off',
        async (params) => ({
          request_id: 'TO-789',
          employee_id: params.employee_id,
          status: 'pending_approval',
        })
      );

      const tools = new Tools([getEmployee, createTimeOff]);
      const chain = new ExecuteToolChain(tools);

      const result = await chain.execute({
        steps: [
          {
            toolName: 'hris_get_employee',
            parameters: { id: 'emp-123' },
          },
          {
            toolName: 'hris_create_time_off',
            parameters: {
              employee_id: '{{step0.result.id}}',
              start_date: '2024-01-15',
              end_date: '2024-01-19',
              type: 'vacation',
            },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.stepResults[1].result.request_id).toBe('TO-789');
    });
  });

  describe('Input validation', () => {
    it('should reject empty steps array', async () => {
      const tools = new Tools([]);
      const chain = new ExecuteToolChain(tools);

      expect(chain.execute({ steps: [] })).rejects.toThrow(
        'Steps array is required and must not be empty'
      );
    });

    it('should handle string input', async () => {
      const mockTool = createMockTool('tool1', 'Test tool', async () => ({ result: 'ok' }));
      const tools = new Tools([mockTool]);
      const chain = new ExecuteToolChain(tools);

      const result = await chain.execute(
        JSON.stringify({
          steps: [
            {
              toolName: 'tool1',
              parameters: {},
            },
          ],
        })
      );

      expect(result.success).toBe(true);
    });
  });

  describe('Beta warning', () => {
    it('should include beta flag and warning', async () => {
      const mockTool = createMockTool('tool1', 'Test tool', async () => ({ result: 'ok' }));
      const tools = new Tools([mockTool]);
      const chain = new ExecuteToolChain(tools);

      const result = await chain.execute({
        steps: [
          {
            toolName: 'tool1',
            parameters: {},
          },
        ],
      });

      expect(result.beta).toBe(true);
      expect(result.warning).toContain('beta feature');
    });
  });
});
