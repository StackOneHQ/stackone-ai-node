import { StackOneError } from './error-stackone';
import { ToolArgumentsError } from './error-tool-arguments';

describe('ToolArgumentsError', () => {
	it('should create an error with the correct name', () => {
		const error = new ToolArgumentsError('Test error');
		expect(error.name).toBe('ToolArgumentsError');
		expect(error.message).toBe('Test error');
	});

	it('is a StackOneError', () => {
		expect(new ToolArgumentsError('x')).toBeInstanceOf(StackOneError);
	});

	it('should support error cause via options', () => {
		const cause = new Error('Original error');
		const error = new ToolArgumentsError('Wrapped error', { cause });
		expect(error.cause).toBe(cause);
	});
});
