import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { MockEmbeddingModelV1 } from 'ai/test';
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
        method: 'POST',
        url: 'https://api.example.com/crm/contacts',
        bodyType: 'json',
        params: [],
      }
    )
  );

  return tools;
};

describe('Meta Tools', () => {
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

    it('should include meta_filter_relevant_tools', () => {
      const filterTool = metaTools.getTool('meta_filter_relevant_tools');
      expect(filterTool).toBeDefined();
      expect(filterTool?.name).toBe('meta_filter_relevant_tools');
    });

    it('should include meta_execute_tool', () => {
      const executeTool = metaTools.getTool('meta_execute_tool');
      expect(executeTool).toBeDefined();
      expect(executeTool?.name).toBe('meta_execute_tool');
    });
  });

  describe('meta_filter_relevant_tools', () => {
    let filterTool: BaseTool;

    beforeEach(() => {
      const tool = metaTools.getTool('meta_filter_relevant_tools');
      if (!tool) throw new Error('meta_filter_relevant_tools not found');
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
      const filterTool = metaTools.getTool('meta_filter_relevant_tools');
      const executeTool = metaTools.getTool('meta_execute_tool');
      if (!filterTool || !executeTool) throw new Error('Meta tools not found');

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

      const filterTool = openAITools.find((t) => t.function.name === 'meta_filter_relevant_tools');
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

      expect(aiSdkTools).toHaveProperty('meta_filter_relevant_tools');
      expect(aiSdkTools).toHaveProperty('meta_execute_tool');

      expect(typeof aiSdkTools.meta_filter_relevant_tools.execute).toBe('function');
      expect(typeof aiSdkTools.meta_execute_tool.execute).toBe('function');
    });

    it('should execute through AI SDK format', async () => {
      const aiSdkTools = metaTools.toAISDK();

      const result = await aiSdkTools.meta_filter_relevant_tools.execute?.(
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

  describe('Vector Search Integration', () => {
    let vectorTools: Tools;
    let vectorMetaTools: Tools;

    beforeEach(async () => {
      // Create 1536-dimensional embeddings for testing
      const createMockEmbedding = (seed: number): number[] =>
        Array.from({ length: 1536 }, (_, i) => Math.sin((seed + i) * 0.1));

      const mockTools = createMockTools();
      vectorTools = new Tools(mockTools);

      // Create mock model with proper embedding behavior
      const mockModel = new MockEmbeddingModelV1({
        modelId: 'test-embedding-model',
        provider: 'test-provider',
        doEmbed: async ({ values }) => {
          // Return embeddings based on input values
          const embeddings = values.map((_, index) => createMockEmbedding(index));
          return {
            embeddings,
            usage: { tokens: values.length * 2 },
          };
        },
      });

      vectorMetaTools = await vectorTools.metaTools({ model: mockModel });
    });

    it('should create meta tools with vector search capabilities', () => {
      expect(vectorMetaTools.length).toBe(2);

      const filterTool = vectorMetaTools.getTool('meta_filter_relevant_tools');
      expect(filterTool).toBeDefined();

      // Should have additional vector search parameters
      const params = filterTool?.parameters as { properties: Record<string, unknown> };
      expect(params.properties.mode).toBeDefined();
      expect(params.properties.hybridWeights).toBeDefined();
    });

    it('should perform BM25-only search when mode is "bm25"', async () => {
      const filterTool = vectorMetaTools.getTool('meta_filter_relevant_tools');
      if (!filterTool) throw new Error('Filter tool not found');

      const result = await filterTool.execute({
        query: 'employee management',
        mode: 'bm25',
        limit: 3,
      });

      const toolResults = result.tools as MetaToolSearchResult[];
      expect(Array.isArray(toolResults)).toBe(true);
    });

    it('should perform embeddings search when mode is "embeddings"', async () => {
      const filterTool = vectorMetaTools.getTool('meta_filter_relevant_tools');
      if (!filterTool) throw new Error('Filter tool not found');

      const result = await filterTool.execute({
        query: 'employee management',
        mode: 'embeddings',
        limit: 3,
      });

      const toolResults = result.tools as MetaToolSearchResult[];
      expect(Array.isArray(toolResults)).toBe(true);
    });

    it('should perform hybrid search by default', async () => {
      const filterTool = vectorMetaTools.getTool('meta_filter_relevant_tools');
      if (!filterTool) throw new Error('Filter tool not found');

      const result = await filterTool.execute({
        query: 'employee management',
        limit: 3,
      });

      const toolResults = result.tools as MetaToolSearchResult[];
      expect(Array.isArray(toolResults)).toBe(true);
    });

    it('should use custom hybrid weights', async () => {
      const filterTool = vectorMetaTools.getTool('meta_filter_relevant_tools');
      if (!filterTool) throw new Error('Filter tool not found');

      const result = await filterTool.execute({
        query: 'employee management',
        mode: 'hybrid',
        hybridWeights: { bm25: 0.3, embeddings: 0.7 },
        limit: 3,
      });

      const toolResults = result.tools as MetaToolSearchResult[];
      expect(Array.isArray(toolResults)).toBe(true);
    });

    it('should fall back to text search if embedding generation fails', async () => {
      // Create a separate failing mock model for this test
      const failingMockModel = new MockEmbeddingModelV1({
        modelId: 'failing-model',
        provider: 'test-provider',
        doEmbed: async () => {
          throw new Error('Embedding failed');
        },
      });

      const failingMetaTools = await vectorTools.metaTools({ model: failingMockModel });
      const filterTool = failingMetaTools.getTool('meta_filter_relevant_tools');
      if (!filterTool) throw new Error('Filter tool not found');

      // Should not throw error, but fall back to text search
      const result = await filterTool.execute({
        query: 'employee management',
        mode: 'hybrid',
        limit: 3,
      });

      const toolResults = result.tools as MetaToolSearchResult[];
      expect(Array.isArray(toolResults)).toBe(true);
    });
  });

  describe('Backward Compatibility', () => {
    it('should work without embedding configuration (existing behavior)', async () => {
      const mockTools = createMockTools();
      const tools = new Tools(mockTools);

      // Create meta tools without embedding config (legacy behavior)
      const metaTools = await tools.metaTools();

      expect(metaTools.length).toBe(2);

      const filterTool = metaTools.getTool('meta_filter_relevant_tools');
      expect(filterTool).toBeDefined();

      // Should only have basic parameters (no vector search params)
      const params = filterTool?.parameters as { properties: Record<string, unknown> };
      expect(params.properties.mode).toBeUndefined();
      expect(params.properties.hybridWeights).toBeUndefined();

      // Should still work for text search
      const result = await filterTool.execute({
        query: 'employee management',
        limit: 3,
      });

      const toolResults = result.tools as MetaToolSearchResult[];
      expect(Array.isArray(toolResults)).toBe(true);
    });
  });
});
