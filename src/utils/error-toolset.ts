import { StackOneError } from './error-stackone';

/**
 * Base exception for toolset errors.
 *
 * A subclass of {@link StackOneError}, so `catch (e) { if (e instanceof StackOneError) … }` is a
 * real catch-all for everything the SDK throws. The two used to be unrelated siblings, which
 * meant the obvious catch-all silently missed the configuration and load errors — the ones a
 * user is most likely to hit on their very first call.
 */
export class ToolSetError extends StackOneError {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'ToolSetError';
	}
}

/**
 * Raised when the toolset is configured, or called, with something it cannot use.
 */
export class ToolSetConfigError extends ToolSetError {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'ToolSetConfigError';
	}
}

/**
 * Raised when the tool catalog, or the accounts behind it, cannot be loaded.
 */
export class ToolSetLoadError extends ToolSetError {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'ToolSetLoadError';
	}
}
