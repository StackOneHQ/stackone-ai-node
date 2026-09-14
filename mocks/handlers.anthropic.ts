import { http, HttpResponse } from 'msw';

/**
 * Anthropic Messages API, for anthropic-integration.ts.
 */
export const anthropicHandlers = [
	http.post('https://api.anthropic.com/v1/messages', async ({ request }) => {
		const body = (await request.json()) as {
			messages?: Array<{ content?: unknown; role?: string }>;
			tools?: Array<{ name?: string }>;
		};

		const userMessage = body.messages
			?.filter((message) => message.role === 'user')
			.map((message) =>
				typeof message.content === 'string' ? message.content : JSON.stringify(message.content),
			)
			.join(' ');
		const hasTools = Boolean(body.tools?.length);

		if (hasTools && userMessage?.includes('List the first 5 employees')) {
			return HttpResponse.json({
				id: 'msg_mock_list',
				type: 'message',
				role: 'assistant',
				model: 'claude-haiku-4-5-20241022',
				content: [
					{
						type: 'tool_use',
						id: 'toolu_mock_list',
						name: 'workday_list_workers',
						input: { query: { limit: 5 } },
					},
				],
				stop_reason: 'tool_use',
				usage: { input_tokens: 100, output_tokens: 50 },
			});
		}

		return HttpResponse.json({
			id: 'msg_default',
			type: 'message',
			role: 'assistant',
			model: 'claude-haiku-4-5-20241022',
			content: [{ type: 'text', text: 'Mock response' }],
			stop_reason: 'end_turn',
			usage: { input_tokens: 10, output_tokens: 10 },
		});
	}),
];
