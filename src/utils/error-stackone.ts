/**
 * Base exception for StackOne errors
 */
export class StackOneError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'StackOneError';
	}
}
