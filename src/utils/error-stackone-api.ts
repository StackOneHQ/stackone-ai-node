import { USER_AGENT } from '../consts';
import { StackOneError } from './error-stackone';

/**
 * Lead with the server's own explanation of what went wrong.
 *
 * A bare status ("400 Bad Request") never says which field was wrong, even though the answer is
 * already in hand in the response body. This is the error a user hits on every bad tool call, so
 * it is the one worth making actionable: `400 Bad Request: path.id is missing`.
 */
export function describeApiFailure(
	status: number,
	statusText: string,
	body: unknown,
	url: string,
): string {
	let detail: string | undefined;
	if (typeof body === 'object' && body !== null && !Array.isArray(body)) {
		const record = body as Record<string, unknown>;
		const key = ['message', 'error', 'detail'].find((name) => typeof record[name] === 'string');
		detail = key ? (record[key] as string) : JSON.stringify(body);
	} else if (typeof body === 'string' && body.trim()) {
		detail = body.trim().slice(0, 500);
	} else if (body != null && typeof body !== 'string') {
		detail = JSON.stringify(body);
	}
	const heading = `${status} ${statusText}`.trim();
	return detail ? `${heading}: ${detail}` : `${heading} from ${url}`;
}

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
		errorMessage += `\n- User-Agent: ${USER_AGENT}`;

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
