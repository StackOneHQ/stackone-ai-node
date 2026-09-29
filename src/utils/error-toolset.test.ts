import { StackOneAPIError } from './error-stackone-api';
import { StackOneError } from './error-stackone';
import { ToolSetConfigError, ToolSetError, ToolSetLoadError } from './error-toolset';

describe('error hierarchy', () => {
	// `instanceof StackOneError` must be a real catch-all. The toolset errors used to extend
	// Error directly, so the obvious catch-all missed the two errors a user hits first.
	it.each([
		['ToolSetError', new ToolSetError('x')],
		['ToolSetConfigError', new ToolSetConfigError('x')],
		['ToolSetLoadError', new ToolSetLoadError('x')],
		['StackOneAPIError', new StackOneAPIError('x', 500, null)],
	])('%s is a StackOneError', (name, error) => {
		expect(error).toBeInstanceOf(StackOneError);
		expect(error.name).toBe(name);
	});

	it('keeps the toolset errors under ToolSetError', () => {
		expect(new ToolSetConfigError('x')).toBeInstanceOf(ToolSetError);
		expect(new ToolSetLoadError('x')).toBeInstanceOf(ToolSetError);
	});

	it('carries a cause', () => {
		const cause = new Error('root');
		expect(new ToolSetLoadError('wrapped', { cause }).cause).toBe(cause);
	});
});
