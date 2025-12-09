import * as StackOneAI from './index';

describe('Module Exports', () => {
	it('should export main classes and utilities', () => {
		// Check core classes
		expect(StackOneAI.StackOneTool).toBeDefined();
		expect(StackOneAI.Tools).toBeDefined();
		expect(StackOneAI.StackOneToolSet).toBeDefined();
		expect(StackOneAI.BaseTool).toBeDefined();

		// Check errors
		expect(StackOneAI.StackOneError).toBeDefined();
		expect(StackOneAI.StackOneAPIError).toBeDefined();
		expect(StackOneAI.ToolSetError).toBeDefined();
		expect(StackOneAI.ToolSetConfigError).toBeDefined();
		expect(StackOneAI.ToolSetLoadError).toBeDefined();

		// Check feedback tool
		expect(StackOneAI.createFeedbackTool).toBeDefined();
	});
});
