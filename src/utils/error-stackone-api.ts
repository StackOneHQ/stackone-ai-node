import { USER_AGENT } from '../consts';
import { StackOneError } from './error-stackone';

/**
 * Raised when the StackOne API returns an error. Carries the HTTP status and the response
 * body, so a caller can branch on a 412 (a dead account) rather than parse the message.
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
		super(message, options);
		this.name = 'StackOneAPIError';
		this.statusCode = statusCode;
		this.responseBody = responseBody;
		this.requestBody = requestBody;

		// Extract provider errors if they exist
		if (
			typeof responseBody === 'object' &&
			responseBody !== null &&
			'provider_errors' in responseBody &&
			Array.isArray(responseBody.provider_errors)
		) {
			this.providerErrors = responseBody.provider_errors;
		}
	}

	toString(): string {
		return this.formatErrorMessage();
	}

	// Format the error message for better readability
	private formatErrorMessage(): string {
		// Format the main error message
		let errorMessage = `API Error: ${this.statusCode} - ${this.message.replace(` for ${this.getUrlFromMessage()}`, '')}`;

		// Add the URL on a new line for better readability
		const url = this.getUrlFromMessage();
		if (url !== null && url !== '') {
			errorMessage += `\nEndpoint: ${url}`;
		}

		// Add request headers information (for debugging)
		errorMessage += '\n\nRequest Headers:';
		errorMessage += '\n- Authorization: [REDACTED]';
		errorMessage += `\n- User-Agent: ${USER_AGENT}`;

		// Add request body information if available
		const hasRequestBody = Boolean(this.requestBody);
		if (hasRequestBody) {
			errorMessage += `\n\nRequest Body:${formatRequestBody(this.requestBody)}`;
		}

		// Add provider error information if available
		if (this.providerErrors != null && this.providerErrors.length > 0) {
			errorMessage += formatProviderError(this.providerErrors[0]);
		}

		return errorMessage;
	}

	// Helper method to extract URL from the error message
	private getUrlFromMessage(): string | null {
		const match = this.message.match(/ for (https?:\/\/[^\s:]+)/);
		return match === null ? null : match[1];
	}
}

// Format a request body: an object as indented JSON, a string as is, anything else as JSON
function formatRequestBody(requestBody: unknown): string {
	try {
		if (typeof requestBody === 'object') {
			return `\n${JSON.stringify(requestBody, null, 2)}`;
		}
		if (typeof requestBody === 'string') {
			return ` ${requestBody}`;
		}
		return ` ${JSON.stringify(requestBody)}`;
	} catch {
		return ' [Unable to stringify request body]';
	}
}

// Format the first provider error: its status, raw error message and endpoint, where present
function formatProviderError(providerError: unknown): string {
	if (typeof providerError !== 'object' || providerError === null) {
		return '';
	}
	const status: unknown = Reflect.get(providerError, 'status');
	const rawError = rawErrorMessage(Reflect.get(providerError, 'raw'));
	const url: unknown = Reflect.get(providerError, 'url');
	let errorMessage = '\n\nProvider Error:';

	if (typeof status === 'number') {
		errorMessage += ` ${status}`;
	}

	// Include raw error message if available
	if (rawError !== undefined) {
		errorMessage += ` - ${rawError}`;
	}

	// Add provider URL on a new line
	if (typeof url === 'string') {
		errorMessage += `\nProvider Endpoint: ${url}`;
	}

	return errorMessage;
}

// The `error` string of a provider's raw response, if it has one
function rawErrorMessage(raw: unknown): string | undefined {
	if (typeof raw === 'object' && raw !== null && 'error' in raw && typeof raw.error === 'string') {
		return raw.error;
	}
	return undefined;
}
