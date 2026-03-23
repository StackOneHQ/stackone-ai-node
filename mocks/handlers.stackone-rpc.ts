import { http, HttpResponse } from 'msw';
import { TEST_BASE_URL } from './constants';

/**
 * StackOne Actions RPC endpoint handlers
 */
export const stackoneRpcHandlers = [
	http.post(`${TEST_BASE_URL}/actions/rpc`, async ({ request }) => {
		const authHeader = request.headers.get('Authorization');
		const accountIdHeader = request.headers.get('x-account-id');

		// Check for authentication
		if (!authHeader || !authHeader.startsWith('Basic ')) {
			return HttpResponse.json(
				{ error: 'Unauthorized', message: 'Missing or invalid authorization header' },
				{ status: 401 },
			);
		}

		const body = (await request.json()) as {
			action?: string;
			body?: Record<string, unknown>;
			defender_enabled?: boolean;
			headers?: Record<string, string>;
			path?: Record<string, string>;
			query?: Record<string, string>;
		};

		// Validate action is provided
		if (!body.action) {
			return HttpResponse.json(
				{ error: 'Bad Request', message: 'Action is required' },
				{ status: 400 },
			);
		}

		// Test action to verify x-account-id is sent as HTTP header
		if (body.action === 'test_account_id_header') {
			return HttpResponse.json({
				data: {
					httpHeader: accountIdHeader,
					bodyHeader: body.headers?.['x-account-id'],
				},
			});
		}

		// Return mock response based on action
		if (body.action === 'bamboohr_get_employee') {
			return HttpResponse.json({
				data: {
					id: body.path?.id || 'test-id',
					name: 'Test Employee',
					...body.body,
				},
			});
		}

		if (body.action === 'bamboohr_list_employees') {
			return HttpResponse.json({
				data: [
					{ id: '1', name: 'Employee 1' },
					{ id: '2', name: 'Employee 2' },
				],
			});
		}

		if (body.action === 'test_error_action') {
			return HttpResponse.json(
				{ error: 'Internal Server Error', message: 'Test error response' },
				{ status: 500 },
			);
		}

		// Default response for other actions — echo back received fields
		return HttpResponse.json({
			data: {
				action: body.action,
				received: {
					body: body.body,
					defender_config: body.defender_config,
					defender_enabled: body.defender_enabled,
					headers: body.headers,
					path: body.path,
					query: body.query,
				},
			},
		});
	}),
];
