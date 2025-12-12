import { http, HttpResponse } from 'msw';

/**
 * StackOne Actions RPC endpoint handlers
 */
export const stackoneRpcHandlers = [
	http.post('https://api.stackone.com/actions/rpc', async ({ request }) => {
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

		// Default response for other actions
		return HttpResponse.json({
			data: {
				action: body.action,
				received: {
					body: body.body,
					headers: body.headers,
					path: body.path,
					query: body.query,
				},
			},
		});
	}),
];
