import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { BaseTool, type MetaToolSearchResult, Tools } from '../tool';
import { ParameterLocation } from '../types';

// Create mock tools for testing
const createMockTools = (): BaseTool[] => {
  const tools: BaseTool[] = [];

  // HRIS tools
  tools.push(
    new BaseTool(
      'hris_create_employee',
      'Create a new employee record in the HRIS system',
      {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Employee name' },
          email: { type: 'string', description: 'Employee email' },
        },
        required: ['name', 'email'],
      },
      {
        kind: 'http',
        method: 'POST',
        url: 'https://api.example.com/hris/employees',
        bodyType: 'json',
        params: [],
      }
    )
  );

  tools.push(
    new BaseTool(
      'hris_list_employees',
      'List all employees in the HRIS system',
      {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of employees to return' },
        },
      },
      {
        kind: 'http',
        method: 'GET',
        url: 'https://api.example.com/hris/employees',
        bodyType: 'json',
        params: [
          {
            name: 'limit',
            location: ParameterLocation.QUERY,
            type: 'number',
          },
        ],
      }
    )
  );

  tools.push(
    new BaseTool(
      'hris_create_time_off',
      'Create a time off request for an employee',
      {
        type: 'object',
        properties: {
          employeeId: { type: 'string', description: 'Employee ID' },
          startDate: { type: 'string', description: 'Start date of time off' },
          endDate: { type: 'string', description: 'End date of time off' },
        },
        required: ['employeeId', 'startDate', 'endDate'],
      },
      {
        kind: 'http',
        method: 'POST',
        url: 'https://api.example.com/hris/time-off',
        bodyType: 'json',
        params: [],
      }
    )
  );

  // ATS tools
  tools.push(
    new BaseTool(
      'ats_create_candidate',
      'Create a new candidate in the ATS',
      {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Candidate name' },
          email: { type: 'string', description: 'Candidate email' },
        },
        required: ['name', 'email'],
      },
      {
        kind: 'http',
        method: 'POST',
        url: 'https://api.example.com/ats/candidates',
        bodyType: 'json',
        params: [],
      }
    )
  );

  tools.push(
    new BaseTool(
      'ats_list_candidates',
      'List all candidates in the ATS',
      {
        type: 'object',
        properties: {
          status: { type: 'string', description: 'Filter by candidate status' },
        },
      },
      {
        kind: 'http',
        method: 'GET',
        url: 'https://api.example.com/ats/candidates',
        bodyType: 'json',
        params: [
          {
            name: 'status',
            location: ParameterLocation.QUERY,
            type: 'string',
          },
        ],
      }
    )
  );

  // CRM tools
  tools.push(
    new BaseTool(
      'crm_create_contact',
      'Create a new contact in the CRM',
      {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Contact name' },
          company: { type: 'string', description: 'Company name' },
        },
        required: ['name'],
      },
      {
        kind: 'http',
        method: 'POST',
        url: 'https://api.example.com/crm/contacts',
        bodyType: 'json',
        params: [],
      }
    )
  );

  return tools;
};

describe('Meta Search Tools', () => {
  let tools: Tools;
  let metaTools: Tools;

  beforeEach(async () => {
    const mockTools = createMockTools();
    tools = new Tools(mockTools);
    metaTools = await tools.metaTools();
  });

  afterEach(() => {
    mock.restore();
  });

  describe('metaTools()', () => {
    it('should return two meta tools', () => {
      expect(metaTools.length).toBe(2);
    });

    it('should include meta_search_tools', () => {
      const filterTool = metaTools.getTool('meta_search_tools');
      expect(filterTool).toBeDefined();
      expect(filterTool?.name).toBe('meta_search_tools');
    });

    it('should include meta_execute_tool', () => {
      const executeTool = metaTools.getTool('meta_execute_tool');
      expect(executeTool).toBeDefined();
      expect(executeTool?.name).toBe('meta_execute_tool');
    });
  });

  describe('meta_search_tools', () => {
    let filterTool: BaseTool;

    beforeEach(() => {
      const tool = metaTools.getTool('meta_search_tools');
      if (!tool) throw new Error('meta_search_tools not found');
      filterTool = tool;
    });

    it('should find relevant HRIS tools', async () => {
      const result = await filterTool.execute({
        query: 'manage employees in HRIS',
        limit: 5,
      });

      expect(result.tools).toBeDefined();
      expect(Array.isArray(result.tools)).toBe(true);

      const toolResults = result.tools as MetaToolSearchResult[];
      const toolNames = toolResults.map((t) => t.name);

      // Should find HRIS-related tools
      expect(toolNames).toContain('hris_create_employee');
      expect(toolNames).toContain('hris_list_employees');
    });

    it('should find time off related tools', async () => {
      const result = await filterTool.execute({
        query: 'time off request vacation leave',
        limit: 3,
      });

      const toolResults = result.tools as MetaToolSearchResult[];
      const toolNames = toolResults.map((t) => t.name);

      expect(toolNames).toContain('hris_create_time_off');
    });

    it('should respect limit parameter', async () => {
      const result = await filterTool.execute({
        query: 'create',
        limit: 2,
      });

      const toolResults = result.tools as MetaToolSearchResult[];
      expect(toolResults.length).toBeLessThanOrEqual(2);
    });

    it('should filter by minimum score', async () => {
      const result = await filterTool.execute({
        query: 'xyz123 nonexistent',
        minScore: 0.8, // High threshold
      });

      const toolResults = result.tools as MetaToolSearchResult[];
      expect(toolResults.length).toBe(0);
    });

    it('should include tool configurations in results', async () => {
      const result = await filterTool.execute({
        query: 'create employee',
        limit: 1,
      });

      const toolResults = result.tools as MetaToolSearchResult[];
      expect(toolResults.length).toBeGreaterThan(0);

      const firstTool = toolResults[0];
      expect(firstTool).toHaveProperty('name');
      expect(firstTool).toHaveProperty('description');
      expect(firstTool).toHaveProperty('parameters');
      expect(firstTool).toHaveProperty('score');
      expect(typeof firstTool.score).toBe('number');
    });

    it('should handle empty query', async () => {
      const result = await filterTool.execute({
        query: '',
        limit: 5,
      });

      expect(result.tools).toBeDefined();
      expect(Array.isArray(result.tools)).toBe(true);
    });

    it('should handle string parameters', async () => {
      const result = await filterTool.execute(
        JSON.stringify({
          query: 'candidates',
          limit: 3,
        })
      );

      const toolResults = result.tools as MetaToolSearchResult[];
      const toolNames = toolResults.map((t) => t.name);

      expect(toolNames).toContain('ats_create_candidate');
      expect(toolNames).toContain('ats_list_candidates');
    });
  });

  describe('meta_execute_tool', () => {
    let executeTool: BaseTool;

    beforeEach(() => {
      const tool = metaTools.getTool('meta_execute_tool');
      if (!tool) throw new Error('meta_execute_tool not found');
      executeTool = tool;
    });

    it('should execute a tool by name', async () => {
      const result = await executeTool.execute({
        toolName: 'hris_list_employees',
        params: { limit: 10 },
      });

      // The mock tool returns the params
      expect(result).toEqual({ limit: 10 });
    });

    it('should handle tools with required parameters', async () => {
      const result = await executeTool.execute({
        toolName: 'hris_create_employee',
        params: {
          name: 'John Doe',
          email: 'john@example.com',
        },
      });

      expect(result).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
      });
    });

    it('should throw error for non-existent tool', async () => {
      try {
        await executeTool.execute({
          toolName: 'nonexistent_tool',
          params: {},
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect((error as Error).message).toContain('Tool nonexistent_tool not found');
      }
    });

    it('should handle string parameters', async () => {
      const result = await executeTool.execute(
        JSON.stringify({
          toolName: 'crm_create_contact',
          params: {
            name: 'Jane Smith',
            company: 'Acme Corp',
          },
        })
      );

      expect(result).toEqual({
        name: 'Jane Smith',
        company: 'Acme Corp',
      });
    });

    it('should pass through execution options', async () => {
      const result = await executeTool.execute({
        toolName: 'ats_list_candidates',
        params: { status: 'active' },
      });

      expect(result).toEqual({ status: 'active' });
    });
  });

  describe('Integration: meta tools workflow', () => {
    it('should discover and execute tools in sequence', async () => {
      const filterTool = metaTools.getTool('meta_search_tools');
      const executeTool = metaTools.getTool('meta_execute_tool');
      if (!filterTool || !executeTool) throw new Error('Meta search tools not found');

      // Step 1: Discover relevant tools
      const searchResult = await filterTool.execute({
        query: 'create new employee in HR system',
        limit: 3,
      });

      const toolResults = searchResult.tools as MetaToolSearchResult[];
      expect(toolResults.length).toBeGreaterThan(0);

      // Find the create employee tool
      const createEmployeeTool = toolResults.find((t) => t.name === 'hris_create_employee');
      expect(createEmployeeTool).toBeDefined();

      // Step 2: Execute the discovered tool
      const executeResult = await executeTool.execute({
        toolName: createEmployeeTool.name,
        params: {
          name: 'Alice Johnson',
          email: 'alice@example.com',
        },
      });

      expect(executeResult).toEqual({
        name: 'Alice Johnson',
        email: 'alice@example.com',
      });
    });
  });

  describe('OpenAI format', () => {
    it('should convert meta tools to OpenAI format', () => {
      const openAITools = metaTools.toOpenAI();

      expect(openAITools).toHaveLength(2);

      const filterTool = openAITools.find((t) => t.function.name === 'meta_search_tools');
      expect(filterTool).toBeDefined();
      expect(filterTool?.function.parameters?.properties).toHaveProperty('query');
      expect(filterTool?.function.parameters?.properties).toHaveProperty('limit');
      expect(filterTool?.function.parameters?.properties).toHaveProperty('minScore');

      const executeTool = openAITools.find((t) => t.function.name === 'meta_execute_tool');
      expect(executeTool).toBeDefined();
      expect(executeTool?.function.parameters?.properties).toHaveProperty('toolName');
      expect(executeTool?.function.parameters?.properties).toHaveProperty('params');
    });
  });

  describe('AI SDK format', () => {
    it('should convert meta tools to AI SDK format', () => {
      const aiSdkTools = metaTools.toAISDK();

      expect(aiSdkTools).toHaveProperty('meta_search_tools');
      expect(aiSdkTools).toHaveProperty('meta_execute_tool');

      expect(typeof aiSdkTools.meta_search_tools.execute).toBe('function');
      expect(typeof aiSdkTools.meta_execute_tool.execute).toBe('function');
    });

    it('should execute through AI SDK format', async () => {
      const aiSdkTools = metaTools.toAISDK();

      const result = await aiSdkTools.meta_search_tools.execute?.(
        { query: 'ATS candidates', limit: 2 },
        { toolCallId: 'test-call-1', messages: [] }
      );
      if (!result) throw new Error('No result from execute');

      const toolResults = (result as { tools: MetaToolSearchResult[] }).tools;
      expect(Array.isArray(toolResults)).toBe(true);

      const toolNames = toolResults.map((t) => t.name);
      expect(toolNames).toContain('ats_create_candidate');
    });
  });
});
