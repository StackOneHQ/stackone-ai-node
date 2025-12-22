import { StackOneError } from './error-stackone';

describe('StackOneError', () => {
	it('should create an error with the correct name', () => {
		const error = new StackOneError('Test error');
		expect(error.name).toBe('StackOneError');
		expect(error.message).toBe('Test error');
	});

	it('should support error cause via options', () => {
		const cause = new Error('Original error');
		const error = new StackOneError('Wrapped error', { cause });
		expect(error.cause).toBe(cause);
	});
});
