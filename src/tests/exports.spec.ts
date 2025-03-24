import { describe, expect, it } from 'bun:test';
import * as StackOneAI from '../index';

describe('Module Exports', () => {
  it('should export main classes and utilities', () => {
    // Check core classes
    expect(StackOneAI.StackOneTool).toBeDefined();
    expect(StackOneAI.Tools).toBeDefined();
    expect(StackOneAI.StackOneToolSet).toBeDefined();

    // Check errors
    expect(StackOneAI.StackOneError).toBeDefined();
    expect(StackOneAI.StackOneAPIError).toBeDefined();
    expect(StackOneAI.ToolSetError).toBeDefined();
    expect(StackOneAI.ToolSetConfigError).toBeDefined();
    expect(StackOneAI.ToolSetLoadError).toBeDefined();

    // Check OpenAPI classes
    expect(StackOneAI.OpenAPIToolSet).toBeDefined();
    expect(StackOneAI.OpenAPILoader).toBeDefined();
    expect(StackOneAI.OpenAPIParser).toBeDefined();
  });
});
