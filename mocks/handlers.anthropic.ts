import { http, HttpResponse } from 'msw';
import {
	EXAMPLE_ANSWER,
	EXAMPLE_PROMPT,
	EXAMPLE_TOOL_CALL,
	bodyField,
	carriesToolResult,
	isRecord,
	offersTools,
} from './handlers.utils';

/** Whether any user message is the example prompt. */
const asksExamplePrompt = (messages: unknown): boolean => {
	const items: unknown[] = Array.isArray(messages) ? messages : [];
	return items.some(
		(item) => isRecord(item) && item.role === 'user' && item.content === EXAMPLE_PROMPT,
	);
};

/** Anthropic Messages, answering the prompt anthropic-integration.ts sends. */
export const anthropicHandlers = [
	http.post('https://api.anthropic.com/v1/messages', async ({ request }) => {
		const body = await request.json();
		const callsTool =
			!carriesToolResult(body) &&
			offersTools(body) &&
			asksExamplePrompt(bodyField(body, 'messages'));
		return HttpResponse.json({
			id: 'msg_mock',
			type: 'message',
			role: 'assistant',
			model: 'claude-haiku-4-5',
			content: callsTool
				? [{ type: 'tool_use', id: 'toolu_mock_list', ...EXAMPLE_TOOL_CALL }]
				: [{ type: 'text', text: carriesToolResult(body) ? EXAMPLE_ANSWER : 'Mock response' }],
			stop_reason: callsTool ? 'tool_use' : 'end_turn',
			usage: { input_tokens: 100, output_tokens: 50 },
		});
	}),
];
