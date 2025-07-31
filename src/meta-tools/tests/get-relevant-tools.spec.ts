import { describe, expect, it } from 'bun:test';
import { BaseTool } from '../../tool';
import type { ExecuteConfig, ToolParameters } from '../../types';
import { GetRelevantTools } from '../get-relevant-tools';

// Mock tools for testing
const createMockTool = (name: string, description: string): BaseTool => {
  const params: ToolParameters = {
    type: 'object',
    properties: {
      id: { type: 'string' },
    },
  };

  const executeConfig: ExecuteConfig = {
    method: 'GET',
    url: 'https://api.example.com/test',
    bodyType: 'json',
    params: [],
  };

  return new BaseTool(name, description, params, executeConfig);
};

const mockTools = [
  createMockTool('jira_get_ticket', 'Get a Jira ticket by ID'),
  createMockTool('jira_create_ticket', 'Create a new Jira ticket'),
  createMockTool('jira_update_ticket', 'Update an existing Jira ticket'),
  createMockTool('documents_search', 'Search for documents in the system'),
  createMockTool('documents_upload', 'Upload a new document'),
  createMockTool('hris_list_employees', 'List all employees in the HRIS system'),
  createMockTool('hris_get_employee', 'Get a specific employee by ID'),
  createMockTool('ats_list_candidates', 'List all candidates in the ATS'),
  createMockTool('ats_move_application', 'Move a job application to a different stage'),
  createMockTool('hris_create_time_off', 'Create a time off request for an employee'),
];

describe('GetRelevantTools', () => {
  const tool = new GetRelevantTools(mockTools);

  describe('Basic functionality', () => {
    it('should find tools by exact name match', async () => {
      const result = await tool.execute({
        query: 'jira_get_ticket',
      });

      expect(result.success).toBe(true);
      expect(result.resultsCount).toBeGreaterThan(0);

      // The first result should be the exact match
      expect(result.tools[0].name).toBe('jira_get_ticket');
      expect(result.tools[0].score).toBe(1.0);
      expect(result.tools[0].matchReason).toBe('exact name match');
    });

    it('should find tools by description keywords', async () => {
      const result = await tool.execute({
        query: 'search documents',
      });

      expect(result.success).toBe(true);
      expect(result.resultsCount).toBeGreaterThan(0);
      expect(result.tools[0].name).toBe('documents_search');
    });

    it('should respect limit parameter', async () => {
      const result = await tool.execute({
        query: 'jira',
        limit: 2,
      });

      expect(result.success).toBe(true);
      expect(result.tools).toHaveLength(2);
    });

    it('should respect minScore parameter', async () => {
      const result = await tool.execute({
        query: 'xyz',
        minScore: 0.8,
      });

      expect(result.success).toBe(true);
      expect(result.resultsCount).toBe(0);
    });
  });

  describe('Use case examples', () => {
    it('should find Jira ticket reading tools', async () => {
      const result = await tool.execute({
        query: 'jira ticket',
      });

      expect(result.success).toBe(true);
      expect(result.resultsCount).toBeGreaterThan(0);
      const toolNames = result.tools.map((t: { name: string }) => t.name);
      expect(toolNames).toContain('jira_get_ticket');
    });

    it('should find document search tools', async () => {
      const result = await tool.execute({
        query: 'documents search',
      });

      expect(result.success).toBe(true);
      expect(result.resultsCount).toBeGreaterThan(0);
      expect(result.tools[0].name).toBe('documents_search');
    });

    it('should find employee listing tools', async () => {
      const result = await tool.execute({
        query: 'list employees',
      });

      expect(result.success).toBe(true);
      expect(result.resultsCount).toBeGreaterThan(0);
      expect(result.tools[0].name).toBe('hris_list_employees');
    });

    it('should find candidate listing tools', async () => {
      const result = await tool.execute({
        query: 'list candidates',
      });

      expect(result.success).toBe(true);
      expect(result.resultsCount).toBeGreaterThan(0);
      expect(result.tools[0].name).toBe('ats_list_candidates');
    });

    it('should find application moving tools', async () => {
      const result = await tool.execute({
        query: 'move job application',
      });

      expect(result.success).toBe(true);
      expect(result.resultsCount).toBeGreaterThan(0);
      expect(result.tools[0].name).toBe('ats_move_application');
    });

    it('should find time off creation tools', async () => {
      const result = await tool.execute({
        query: 'create time off request',
      });

      expect(result.success).toBe(true);
      expect(result.resultsCount).toBeGreaterThan(0);
      expect(result.tools[0].name).toBe('hris_create_time_off');
    });
  });

  describe('Filter patterns', () => {
    it('should apply positive filter patterns', async () => {
      const result = await tool.execute({
        query: 'ticket',
        filterPatterns: 'jira_*',
      });

      expect(result.success).toBe(true);
      const toolNames = result.tools.map((t: { name: string }) => t.name);
      for (const name of toolNames) {
        expect(name).toMatch(/^jira_/);
      }
    });

    it('should apply negative filter patterns', async () => {
      const result = await tool.execute({
        query: 'jira',
        filterPatterns: ['jira_*', '!*_create_*'],
      });

      expect(result.success).toBe(true);
      const toolNames = result.tools.map((t: { name: string }) => t.name);
      expect(toolNames).not.toContain('jira_create_ticket');
    });
  });

  describe('Error handling', () => {
    it('should throw error when query is missing', async () => {
      await expect(tool.execute({})).rejects.toThrow('Query parameter is required');
    });

    it('should handle string input', async () => {
      const result = await tool.execute(
        JSON.stringify({
          query: 'jira_get_ticket',
        })
      );

      expect(result.success).toBe(true);
      expect(result.resultsCount).toBeGreaterThan(0);
      expect(result.tools[0].name).toBe('jira_get_ticket');
    });
  });

  describe('Beta warning', () => {
    it('should include beta flag and warning', async () => {
      const result = await tool.execute({
        query: 'test',
      });

      expect(result.beta).toBe(true);
      expect(result.warning).toContain('beta feature');
    });
  });
});
