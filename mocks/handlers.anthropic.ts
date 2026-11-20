import { http, HttpResponse } from 'msw';
import {
	EXAMPLE_ANSWER,
	EXAMPLE_TOOL_CALL,
	bodyField,
	extractTextFromInput,
	nextTurn,
} from './handlers.utils';

/** Anthropic Messages, answering the prompt anthropic-integration.ts sends. */
export const anthropicHandlers = [
	http.post('https://api.anthropic.com/v1/messages', async ({ request }) => {
		const body = await request.json();
		const turn = nextTurn(body, extractTextFromInput(bodyField(body, 'messages')));
		return HttpResponse.json({
			id: 'msg_mock',
			type: 'message',
			role: 'assistant',
			model: 'claude-haiku-4-5',
			content:
				turn === 'tool_call'
					? [{ type: 'tool_use', id: 'toolu_mock_list', ...EXAMPLE_TOOL_CALL }]
					: [{ type: 'text', text: turn === 'answer' ? EXAMPLE_ANSWER : 'Mock response' }],
			stop_reason: turn === 'tool_call' ? 'tool_use' : 'end_turn',
			usage: { input_tokens: 100, output_tokens: 50 },
		});
	}),
];
