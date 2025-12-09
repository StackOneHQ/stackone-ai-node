// Type aliases for common types

/**
 * Base exception for StackOne errors
 */
export class StackOneError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'StackOneError';
	}
}

/**
 * Raised when the StackOne API returns an error
 */
export class StackOneAPIError extends StackOneError {
	statusCode: number;
	responseBody: unknown;
	providerErrors?: unknown[];
	requestBody?: unknown;

	constructor(
		message: string,
		statusCode: number,
		responseBody: unknown,
		requestBody?: unknown,
		options?: ErrorOptions,
	) {
		// Extract the error message from responseBody if it exists
		let errorMessage = message;
		if (
			responseBody &&
			typeof responseBody === 'object' &&
			'message' in responseBody &&
			responseBody.message &&
			typeof responseBody.message === 'string'
		) {
			errorMessage = `${message}: ${responseBody.message}`;
		}

		super(errorMessage, options);
		this.name = 'StackOneAPIError';
		this.statusCode = statusCode;
		this.responseBody = responseBody;
		this.requestBody = requestBody;

		// Extract provider errors if they exist
		if (
			responseBody &&
			typeof responseBody === 'object' &&
			'provider_errors' in responseBody &&
			Array.isArray(responseBody.provider_errors)
		) {
			this.providerErrors = responseBody.provider_errors;
		}
	}

	toString(): string {
		return this._formatErrorMessage();
	}

	// Format the error message for better readability
	private _formatErrorMessage(): string {
		// Format the main error message
		let errorMessage = `API Error: ${this.statusCode} - ${this.message.replace(` for ${this._getUrlFromMessage()}`, '')}`;

		// Add the URL on a new line for better readability
		const url = this._getUrlFromMessage();
		if (url) {
			errorMessage += `\nEndpoint: ${url}`;
		}

		// Add request headers information (for debugging)
		errorMessage += '\n\nRequest Headers:';
		errorMessage += '\n- Authorization: [REDACTED]';
		errorMessage += '\n- User-Agent: stackone-ai-node';

		// Add request body information if available
		if (this.requestBody) {
			errorMessage += '\n\nRequest Body:';
			try {
				if (typeof this.requestBody === 'object') {
					errorMessage += `\n${JSON.stringify(this.requestBody, null, 2)}`;
				} else if (typeof this.requestBody === 'string') {
					errorMessage += ` ${this.requestBody}`;
				} else {
					errorMessage += ` ${JSON.stringify(this.requestBody)}`;
				}
			} catch {
				errorMessage += ' [Unable to stringify request body]';
			}
		}

		// Add provider error information if available
		if (this.providerErrors && this.providerErrors.length > 0) {
			errorMessage += this._formatProviderErrors();
		}

		return errorMessage;
	}

	// Format provider errors
	private _formatProviderErrors(): string {
		let errorMessage = '';
		const providerError = this.providerErrors?.[0];

		if (typeof providerError === 'object' && providerError !== null) {
			errorMessage += '\n\nProvider Error:';

			if ('status' in providerError && typeof providerError.status === 'number') {
				errorMessage += ` ${providerError.status}`;
			}

			// Include raw error message if available
			if (
				'raw' in providerError &&
				typeof providerError.raw === 'object' &&
				providerError.raw !== null &&
				'error' in providerError.raw &&
				typeof providerError.raw.error === 'string'
			) {
				errorMessage += ` - ${providerError.raw.error}`;
			}

			// Add provider URL on a new line
			if ('url' in providerError && typeof providerError.url === 'string') {
				errorMessage += `\nProvider Endpoint: ${providerError.url}`;
			}
		}

		return errorMessage;
	}

	// Helper method to extract URL from the error message
	private _getUrlFromMessage(): string | null {
		const match = this.message.match(/ for (https?:\/\/[^\s:]+)/);
		return match ? match[1] : null;
	}
}
