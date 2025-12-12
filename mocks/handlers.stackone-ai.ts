import { http, HttpResponse } from 'msw';

/**
 * StackOne AI and Tools endpoint handlers
 */
export const stackoneAiHandlers = [
	// StackOne API spec endpoints
	http.get('https://api.stackone.com/api/v1/:category/openapi.json', ({ params }) => {
		const { category } = params;

		if (category === 'hris') {
			return HttpResponse.json({
				openapi: '3.0.0',
				info: { title: 'HRIS API', version: '1.0.0' },
				paths: { '/employees': {} },
			});
		}

		return HttpResponse.json({ error: 'Not found' }, { status: 404 });
	}),

	// StackOne AI tool feedback endpoint
	http.post('https://api.stackone.com/ai/tool-feedback', async ({ request }) => {
		await request.json(); // Validate request body is JSON
		return HttpResponse.json({
			message: 'Feedback successfully stored',
			key: 'test-key.json',
			submitted_at: new Date().toISOString(),
			trace_id: 'test-trace-id',
		});
	}),

	// StackOne fetchTools endpoint for fetch-tools.ts example
	http.get('https://api.stackone.com/ai/tools', () => {
		return HttpResponse.json({
			tools: [
				{
					name: 'bamboohr_list_employees',
					description: 'List all employees',
					parameters: {
						type: 'object',
						properties: {
							query: {
								type: 'object',
								properties: { limit: { type: 'number' } },
							},
						},
					},
				},
				{
					name: 'bamboohr_get_employee',
					description: 'Get employee by ID',
					parameters: {
						type: 'object',
						properties: { id: { type: 'string' } },
						required: ['id'],
					},
				},
				{
					name: 'bamboohr_create_employee',
					description: 'Create a new employee',
					parameters: {
						type: 'object',
						properties: { name: { type: 'string' }, email: { type: 'string' } },
					},
				},
			],
		});
	}),

	// External OAS spec endpoint for openapi-toolset.ts example
	http.get('https://api.eu1.stackone.com/oas/hris.json', () => {
		return HttpResponse.json({
			openapi: '3.0.0',
			info: { title: 'StackOne HRIS API', version: '1.0.0' },
			servers: [{ url: 'https://api.stackone.com' }],
			paths: {
				'/hris/employees': {
					get: {
						operationId: 'bamboohr_list_employees',
						summary: 'List employees',
						parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer' } }],
						responses: { '200': { description: 'Success' } },
					},
				},
				'/hris/employees/{id}': {
					get: {
						operationId: 'bamboohr_get_employee',
						summary: 'Get employee by ID',
						parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
						responses: { '200': { description: 'Success' } },
					},
				},
			},
		});
	}),
];
