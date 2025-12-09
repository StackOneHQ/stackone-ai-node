import { ToolSet } from '../toolsets/base';

// Create a concrete implementation of the abstract ToolSet class for testing
class TestToolSet extends ToolSet {
  // Expose protected methods for testing
  public matchesFilter(toolName: string, filterPattern: string | string[]): boolean {
    return this._matchesFilter(toolName, filterPattern);
  }

  public matchGlob(str: string, pattern: string): boolean {
    return this._matchGlob(str, pattern);
  }
}

describe('ToolSet', () => {
  it('should initialise with default values', () => {
    const toolset = new TestToolSet();
    expect(toolset).toBeDefined();
  });

  it('should initialise with custom values', () => {
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

  describe('Authentication', () => {
    it('should set basic auth headers when provided', () => {
      const toolset = new TestToolSet({
        authentication: {
          type: 'basic',
          credentials: {
            username: 'testuser',
            password: 'testpass',
          },
        },
      });

      // @ts-ignore - Accessing protected properties for testing
      const expectedAuthValue = `Basic ${Buffer.from('testuser:testpass').toString('base64')}`;
      // @ts-ignore - Accessing protected properties for testing
      expect(toolset.headers.Authorization).toBe(expectedAuthValue);
    });

    it('should set bearer auth headers when provided', () => {
      const toolset = new TestToolSet({
        authentication: {
          type: 'bearer',
          credentials: {
            token: 'test-token',
          },
        },
      });

      // @ts-ignore - Accessing protected properties for testing
      expect(toolset.headers.Authorization).toBe('Bearer test-token');
    });

    it('should not override existing Authorization header', () => {
      const toolset = new TestToolSet({
        headers: {
          Authorization: 'Custom auth',
        },
        authentication: {
          type: 'basic',
          credentials: {
            username: 'testuser',
            password: 'testpass',
          },
        },
      });

      // @ts-ignore - Accessing protected properties for testing
      expect(toolset.headers.Authorization).toBe('Custom auth');
    });
  });
});
