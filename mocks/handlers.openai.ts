import { http, HttpResponse } from 'msw';
import {
	EXAMPLE_ANSWER,
	EXAMPLE_PROMPT,
	EXAMPLE_TOOL_CALL,
	bodyField,
	carriesToolResult,
	extractTextFromInput,
	offersTools,
} from './handlers.utils';

/** The model's next turn: the answer once a tool result is back, else a tool call for the prompt. */
const nextTurn = (body: unknown, userText: string): 'answer' | 'tool_call' | 'default' => {
	if (carriesToolResult(body)) {
		return 'answer';
	}
	return offersTools(body) && userText.includes(EXAMPLE_PROMPT) ? 'tool_call' : 'default';
};

const usage = { input_tokens: 100, output_tokens: 50, total_tokens: 150 };

/**
 * OpenAI Responses (used by the AI SDK and openai-responses-integration.ts) and Chat Completions
 * (openai-integration.ts), answering the prompt the examples send.
 */
export const openaiHandlers = [
	http.post('https://api.openai.com/v1/responses', async ({ request }) => {
		const body = await request.json();
		const turn = nextTurn(body, extractTextFromInput(bodyField(body, 'input')));
		const output =
			turn === 'tool_call'
				? [
						{
							type: 'function_call',
							id: 'call_mock_list',
							call_id: 'call_mock_list',
							name: EXAMPLE_TOOL_CALL.name,
							arguments: JSON.stringify(EXAMPLE_TOOL_CALL.input),
							status: 'completed',
						},
					]
				: [
						{
							type: 'message',
							id: 'msg_mock',
							role: 'assistant',
							status: 'completed',
							content: [
								{
									type: 'output_text',
									text: turn === 'answer' ? EXAMPLE_ANSWER : 'Mock response',
									annotations: [],
								},
							],
						},
					];
		return HttpResponse.json({
			id: `resp_mock_${turn}`,
			object: 'response',
			created_at: Date.now(),
			model: 'gpt-5',
			status: 'completed',
			output,
			usage,
		});
	}),

	http.post('https://api.openai.com/v1/chat/completions', async ({ request }) => {
		const body = await request.json();
		const turn = nextTurn(body, extractTextFromInput(bodyField(body, 'messages')));
		const message =
			turn === 'tool_call'
				? {
						role: 'assistant',
						content: null,
						tool_calls: [
							{
								id: 'call_mock_list',
								type: 'function',
								function: {
									name: EXAMPLE_TOOL_CALL.name,
									arguments: JSON.stringify(EXAMPLE_TOOL_CALL.input),
								},
							},
						],
					}
				: { role: 'assistant', content: turn === 'answer' ? EXAMPLE_ANSWER : 'Mock response' };
		return HttpResponse.json({
			id: `chatcmpl-mock-${turn}`,
			object: 'chat.completion',
			created: Date.now(),
			model: 'gpt-5',
			choices: [{ index: 0, message, finish_reason: turn === 'tool_call' ? 'tool_calls' : 'stop' }],
			usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
		});
	}),
];
