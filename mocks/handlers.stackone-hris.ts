import { http, HttpResponse } from 'msw';

/**
 * StackOne Unified HRIS endpoint handlers
 */
export const stackoneHrisHandlers = [
	http.get('https://api.stackone.com/unified/hris/employees', ({ request }) => {
		const accountId = request.headers.get('x-account-id');

		// For error-handling.ts - invalid account ID should return error
		if (accountId === 'invalid_test_account_id') {
			return HttpResponse.json(
				{ error: 'Invalid account ID', message: 'Account not found' },
				{ status: 401 },
			);
		}

		return HttpResponse.json({
			data: [
				{
					id: 'c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA',
					name: 'Michael Scott',
					phone_number: '+1-555-0100',
				},
			],
		});
	}),

	http.get('https://api.stackone.com/unified/hris/employees/:id', ({ params, request }) => {
		const accountId = request.headers.get('x-account-id');

		// For error-handling.ts - invalid account ID
		if (accountId === 'invalid_test_account_id') {
			return HttpResponse.json(
				{ error: 'Invalid account ID', message: 'Account not found' },
				{ status: 401 },
			);
		}

		// For error-handling.ts - missing required id parameter
		if (!params.id) {
			return HttpResponse.json({ error: 'Missing required parameter: id' }, { status: 400 });
		}

		return HttpResponse.json({
			id: params.id,
			name: 'Michael Scott',
			phone_numbers: ['+1-555-0100'],
		});
	}),

	// POST endpoint for creating employees
	http.post('https://api.stackone.com/unified/hris/employees', async ({ request }) => {
		const body = await request.json();
		return HttpResponse.json({
			data: {
				id: 'new-employee-id',
				...(typeof body === 'object' && body !== null ? body : {}),
			},
		});
	}),

	// Document upload endpoint
	http.post(
		'https://api.stackone.com/unified/hris/employees/:id/documents',
		async ({ params, request }) => {
			const body = await request.json();
			return HttpResponse.json({
				data: {
					id: 'doc-123',
					employee_id: params.id,
					...(typeof body === 'object' && body !== null ? body : {}),
				},
			});
		},
	),
];
