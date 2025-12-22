import { USER_AGENT } from '../consts';
import { StackOneAPIError } from './error-stackone-api';

describe('StackOneAPIError', () => {
	it('should create an error with basic properties', () => {
		const error = new StackOneAPIError('API failed', 500, { error: 'Server error' });
		expect(error.name).toBe('StackOneAPIError');
		expect(error.statusCode).toBe(500);
		expect(error.responseBody).toEqual({ error: 'Server error' });
		expect(error.message).toBe('API failed');
	});

	it('should append message from responseBody if present', () => {
		const error = new StackOneAPIError('API failed', 400, {
			message: 'Invalid request body',
		});
		expect(error.message).toBe('API failed: Invalid request body');
	});

	it('should not append message if responseBody.message is not a string', () => {
		const error = new StackOneAPIError('API failed', 400, { message: 123 });
		expect(error.message).toBe('API failed');
	});

	it('should not append message if responseBody.message is empty', () => {
		const error = new StackOneAPIError('API failed', 400, { message: '' });
		expect(error.message).toBe('API failed');
	});

	it('should not append message if responseBody is null', () => {
		const error = new StackOneAPIError('API failed', 400, null);
		expect(error.message).toBe('API failed');
	});

	it('should extract provider errors from responseBody', () => {
		const providerErrors = [{ status: 401, url: 'https://provider.com/api' }];
		const error = new StackOneAPIError('API failed', 400, {
			provider_errors: providerErrors,
		});
		expect(error.providerErrors).toEqual(providerErrors);
	});

	it('should not extract provider errors if not an array', () => {
		const error = new StackOneAPIError('API failed', 400, {
			provider_errors: 'not an array',
		});
		expect(error.providerErrors).toBeUndefined();
	});

	it('should store requestBody when provided', () => {
		const requestBody = { foo: 'bar' };
		const error = new StackOneAPIError('API failed', 400, {}, requestBody);
		expect(error.requestBody).toEqual(requestBody);
	});

	it('should support error cause via options', () => {
		const cause = new Error('Network error');
		const error = new StackOneAPIError('API failed', 500, {}, undefined, { cause });
		expect(error.cause).toBe(cause);
	});

	it('should format basic error message via toString', () => {
		const error = new StackOneAPIError('Request failed', 404, {});
		const result = error.toString();
		expect(result).toContain('API Error: 404');
		expect(result).toContain('Request Headers:');
		expect(result).toContain('Authorization: [REDACTED]');
		expect(result).toContain(`User-Agent: ${USER_AGENT}`);
	});

	it('should include endpoint URL when present in message', () => {
		const error = new StackOneAPIError(
			'Request failed for https://api.stackone.com/tools/execute',
			404,
			{},
		);
		const result = error.toString();
		expect(result).toContain('Endpoint: https://api.stackone.com/tools/execute');
	});

	it('should format object requestBody as JSON', () => {
		const requestBody = { name: 'John', age: 30 };
		const error = new StackOneAPIError('Request failed', 400, {}, requestBody);
		const result = error.toString();
		expect(result).toContain('Request Body:');
		expect(result).toContain('"name": "John"');
		expect(result).toContain('"age": 30');
	});

	it('should format string requestBody', () => {
		const error = new StackOneAPIError('Request failed', 400, {}, 'raw string body');
		const result = error.toString();
		expect(result).toContain('Request Body:');
		expect(result).toContain('raw string body');
	});

	it('should format non-object non-string requestBody', () => {
		const error = new StackOneAPIError('Request failed', 400, {}, 12345);
		const result = error.toString();
		expect(result).toContain('Request Body:');
		expect(result).toContain('12345');
	});

	it('should handle circular reference in requestBody gracefully', () => {
		const circular: Record<string, unknown> = { name: 'test' };
		circular['self'] = circular;
		const error = new StackOneAPIError('Request failed', 400, {}, circular);
		const result = error.toString();
		expect(result).toContain('[Unable to stringify request body]');
	});

	it('should format provider errors with status', () => {
		const error = new StackOneAPIError('Request failed', 400, {
			provider_errors: [{ status: 401 }],
		});
		const result = error.toString();
		expect(result).toContain('Provider Error:');
		expect(result).toContain('401');
	});

	it('should format provider errors with raw error message', () => {
		const error = new StackOneAPIError('Request failed', 400, {
			provider_errors: [
				{
					status: 403,
					raw: { error: 'Access denied' },
				},
			],
		});
		const result = error.toString();
		expect(result).toContain('403');
		expect(result).toContain('Access denied');
	});

	it('should format provider errors with URL', () => {
		const error = new StackOneAPIError('Request failed', 400, {
			provider_errors: [
				{
					status: 500,
					url: 'https://provider.example.com/api/v1/resource',
				},
			],
		});
		const result = error.toString();
		expect(result).toContain('Provider Endpoint: https://provider.example.com/api/v1/resource');
	});

	it('should handle provider error that is not an object', () => {
		const error = new StackOneAPIError('Request failed', 400, {
			provider_errors: ['string error'],
		});
		const result = error.toString();
		expect(result).not.toContain('Provider Error:');
	});

	it('should handle null provider error', () => {
		const error = new StackOneAPIError('Request failed', 400, {
			provider_errors: [null],
		});
		const result = error.toString();
		expect(result).not.toContain('Provider Error:');
	});

	it('should handle provider error with non-number status', () => {
		const error = new StackOneAPIError('Request failed', 400, {
			provider_errors: [{ status: 'not a number' }],
		});
		const result = error.toString();
		expect(result).toContain('Provider Error:');
		expect(result).not.toContain('not a number');
	});

	it('should handle provider error with non-object raw', () => {
		const error = new StackOneAPIError('Request failed', 400, {
			provider_errors: [{ status: 500, raw: 'not an object' }],
		});
		const result = error.toString();
		expect(result).toContain('Provider Error:');
		expect(result).toContain('500');
		expect(result).not.toContain('not an object');
	});

	it('should handle provider error with null raw', () => {
		const error = new StackOneAPIError('Request failed', 400, {
			provider_errors: [{ status: 500, raw: null }],
		});
		const result = error.toString();
		expect(result).toContain('Provider Error:');
		expect(result).toContain('500');
	});

	it('should handle provider error with raw.error that is not a string', () => {
		const error = new StackOneAPIError('Request failed', 400, {
			provider_errors: [{ status: 500, raw: { error: 123 } }],
		});
		const result = error.toString();
		expect(result).toContain('500');
		expect(result).not.toContain('123');
	});

	it('should handle provider error with non-string url', () => {
		const error = new StackOneAPIError('Request failed', 400, {
			provider_errors: [{ status: 500, url: 12345 }],
		});
		const result = error.toString();
		expect(result).not.toContain('Provider Endpoint:');
	});
});
