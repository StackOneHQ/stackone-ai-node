import { describe, expect, it } from 'bun:test';
import { ParameterLocation, Tool } from '../../tools';
import { ToolSet } from '../base';

// Create a concrete implementation of the abstract ToolSet class for testing
class TestToolSet extends ToolSet {
  // Expose protected methods for testing
  public matchesFilter(toolName: string, filterPattern: string | string[]): boolean {
    return this._matchesFilter(toolName, filterPattern);
  }

  public matchGlob(str: string, pattern: string): boolean {
    return this._matchGlob(str, pattern);
  }

  // Add a tool for testing
  public addTool(tool: Tool): void {
    this.tools.push(tool);
  }
}

describe('ToolSet', () => {
  it('should initialize with default values', () => {
    const toolset = new TestToolSet();
    expect(toolset).toBeDefined();
  });

  it('should initialize with custom values', () => {
    const baseUrl = 'https://api.example.com';
    const headers = { 'X-Custom-Header': 'test' };

    const toolset = new TestToolSet({
      baseUrl,
      headers,
    });

    // @ts-ignore - Accessing protected properties for testing
    expect(toolset.baseUrl).toBe(baseUrl);
    // @ts-ignore - Accessing protected properties for testing
    expect(toolset.headers['X-Custom-Header']).toBe('test');
  });

  it('should correctly match glob patterns', () => {
    const toolset = new TestToolSet();

    expect(toolset.matchGlob('hris_get_employee', 'hris_*')).toBe(true);
    expect(toolset.matchGlob('hris_get_employee', 'crm_*')).toBe(false);
    expect(toolset.matchGlob('hris_get_employee', '*_get_*')).toBe(true);
    expect(toolset.matchGlob('hris_get_employee', 'hris_get_?mployee')).toBe(true);
    expect(toolset.matchGlob('hris.get.employee', 'hris.get.employee')).toBe(true);
  });

  it('should correctly filter tools with a pattern', () => {
    const toolset = new TestToolSet();

    expect(toolset.matchesFilter('hris_get_employee', 'hris_*')).toBe(true);
    expect(toolset.matchesFilter('crm_get_contact', 'hris_*')).toBe(false);
    expect(toolset.matchesFilter('hris_get_employee', ['hris_*', 'crm_*'])).toBe(true);
    expect(toolset.matchesFilter('crm_get_contact', ['hris_*', 'crm_*'])).toBe(true);
    expect(toolset.matchesFilter('ats_get_candidate', ['hris_*', 'crm_*'])).toBe(false);

    // Test negative patterns
    expect(toolset.matchesFilter('hris_get_employee', ['*', '!crm_*'])).toBe(true);
    expect(toolset.matchesFilter('crm_get_contact', ['*', '!crm_*'])).toBe(false);
    expect(toolset.matchesFilter('hris_get_employee', ['*', '!hris_*'])).toBe(false);
  });

  it('should get tools with a filter pattern', () => {
    const toolset = new TestToolSet();

    // Create mock tools
    const tool1 = new Tool(
      'hris_get_employee',
      'Get employee details',
      {
        type: 'object',
        properties: { id: { type: 'string' } },
      },
      {
        method: 'GET',
        url: 'https://api.example.com/hris/employees/{id}',
        bodyType: 'json',
        params: [
          {
            name: 'id',
            location: ParameterLocation.PATH,
            type: 'string',
          },
        ],
      }
    );

    const tool2 = new Tool(
      'crm_get_contact',
      'Get contact details',
      {
        type: 'object',
        properties: { id: { type: 'string' } },
      },
      {
        method: 'GET',
        url: 'https://api.example.com/crm/contacts/{id}',
        bodyType: 'json',
        params: [
          {
            name: 'id',
            location: ParameterLocation.PATH,
            type: 'string',
          },
        ],
      }
    );

    // Add tools to the toolset
    toolset.addTool(tool1);
    toolset.addTool(tool2);

    // Test with no filter (should return all tools)
    const allTools = toolset.getTools();
    expect(allTools.length).toBe(2);

    // Test with HRIS filter
    const hrisTools = toolset.getTools('hris_*');
    expect(hrisTools.length).toBe(1);
    expect(hrisTools.toArray()[0].name).toBe('hris_get_employee');

    // Test with CRM filter
    const crmTools = toolset.getTools('crm_*');
    expect(crmTools.length).toBe(1);
    expect(crmTools.toArray()[0].name).toBe('crm_get_contact');

    // Test with non-matching filter
    const nonMatchingTools = toolset.getTools('non_existent_*');
    expect(nonMatchingTools.length).toBe(0);
  });
});
