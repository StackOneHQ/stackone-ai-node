import { StackOneError } from './error-stackone';

/**
 * Raised when a tool's arguments are unusable: not JSON, not an object, or not encodable as
 * JSON.
 *
 * A subclass of {@link StackOneError}, so `catch (e) { if (e instanceof StackOneError) … }`
 * still catches it. Thrown before any request is made.
 */
export class ToolArgumentsError extends StackOneError {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'ToolArgumentsError';
	}
}
