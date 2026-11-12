import { http, HttpResponse } from 'msw';
import { bodyField, extractTextFromInput, isRecord, offersTools } from './handlers.utils';

/** The first user message of a chat completion that mentions an employee, or `''`. */
const employeeQuestion = (messages: unknown): string => {
	if (!Array.isArray(messages)) {
		return '';
	}
	const candidates: unknown[] = messages;
	for (const message of candidates) {
		if (isRecord(message) && message.role === 'user' && typeof message.content === 'string') {
			if (message.content.includes('employee')) {
				return message.content;
			}
		}
	}
	return '';
};

/**
 * OpenAI API endpoints for AI SDK and OpenAI integration examples
 */
export const openaiHandlers = [
	// OpenAI Responses API (used by AI SDK)
	http.post('https://api.openai.com/v1/responses', async ({ request }) => {
		const body = await request.json();
		const userMessage = extractTextFromInput(bodyField(body, 'input'));
		const hasTools = offersTools(body);

		// For ai-sdk-integration.ts
		if (hasTools && userMessage.includes('Get all details')) {
			return HttpResponse.json({
				id: 'resp_mock_ai_sdk',
				object: 'response',
				created_at: Date.now(),
				model: 'gpt-5',
				status: 'completed',
				output: [
					{
						type: 'message',
						id: 'msg_mock_ai_sdk',
						role: 'assistant',
						status: 'completed',
						content: [
							{
								type: 'output_text',
								text: 'The employee Michael Scott has the following details: ID c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA, phone +1-555-0100.',
								annotations: [],
							},
						],
					},
				],
				usage: { input_tokens: 100, output_tokens: 50, total_tokens: 150 },
			});
		}

		// For openai-responses-integration.ts
		if (hasTools && userMessage.includes('c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA')) {
			return HttpResponse.json({
				id: 'resp_mock_responses',
				object: 'response',
				created_at: Date.now(),
				model: 'gpt-5',
				status: 'completed',
				output: [
					{
						type: 'function_call',
						id: 'call_mock_get',
						call_id: 'call_mock_get',
						name: 'bamboohr_get_employee',
						arguments: JSON.stringify({
							id: 'c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA',
						}),
						status: 'completed',
					},
				],
				usage: { input_tokens: 100, output_tokens: 50, total_tokens: 150 },
			});
		}

		// For human-in-the-loop.ts
		if (hasTools && userMessage.includes('Create a new employee')) {
			return HttpResponse.json({
				id: 'resp_mock_hitl',
				object: 'response',
				created_at: Date.now(),
				model: 'gpt-5',
				status: 'completed',
				output: [
					{
						type: 'function_call',
						id: 'call_mock_create',
						call_id: 'call_mock_create',
						name: 'bamboohr_create_employee',
						arguments: JSON.stringify({
							name: 'John Doe',
							personal_email: 'john.doe@example.com',
							department: 'Engineering',
							start_date: '2025-01-01',
							hire_date: '2025-01-01',
						}),
						status: 'completed',
					},
				],
				usage: { input_tokens: 100, output_tokens: 50, total_tokens: 150 },
			});
		}

		// Default response
		return HttpResponse.json({
			id: 'resp_default',
			object: 'response',
			created_at: Date.now(),
			model: 'gpt-5',
			status: 'completed',
			output: [
				{
					type: 'message',
					id: 'msg_default',
					role: 'assistant',
					status: 'completed',
					content: [{ type: 'output_text', text: 'Mock response', annotations: [] }],
				},
			],
			usage: { input_tokens: 10, output_tokens: 10, total_tokens: 20 },
		});
	}),

	// OpenAI Chat Completions API (used by OpenAI SDK directly)
	http.post('https://api.openai.com/v1/chat/completions', async ({ request }) => {
		const body = await request.json();
		const userMessage = employeeQuestion(bodyField(body, 'messages'));
		const hasTools = offersTools(body);

		// For openai-integration.ts - returns tool call for bamboohr_get_employee
		if (hasTools && userMessage.includes('c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA')) {
			return HttpResponse.json({
				id: 'chatcmpl-mock',
				object: 'chat.completion',
				created: Date.now(),
				model: 'gpt-5',
				choices: [
					{
						index: 0,
						message: {
							role: 'assistant',
							content: null,
							tool_calls: [
								{
									id: 'call_mock',
									type: 'function',
									function: {
										name: 'bamboohr_get_employee',
										arguments: JSON.stringify({
											id: 'c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA',
											fields: 'phone_number',
										}),
									},
								},
							],
						},
						finish_reason: 'tool_calls',
					},
				],
				usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
			});
		}

		// For human-in-the-loop.ts - returns tool call for bamboohr_create_employee
		if (hasTools && userMessage.includes('Create a new employee')) {
			return HttpResponse.json({
				id: 'chatcmpl-mock-hitl',
				object: 'chat.completion',
				created: Date.now(),
				model: 'gpt-5',
				choices: [
					{
						index: 0,
						message: {
							role: 'assistant',
							content: null,
							tool_calls: [
								{
									id: 'call_mock_create',
									type: 'function',
									function: {
										name: 'bamboohr_create_employee',
										arguments: JSON.stringify({
											name: 'John Doe',
											personal_email: 'john.doe@example.com',
											department: 'Engineering',
											start_date: '2025-01-01',
											hire_date: '2025-01-01',
										}),
									},
								},
							],
						},
						finish_reason: 'tool_calls',
					},
				],
				usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
			});
		}

		// Default response
		return HttpResponse.json({
			id: 'chatcmpl-default',
			object: 'chat.completion',
			created: Date.now(),
			model: 'gpt-5',
			choices: [
				{
					index: 0,
					message: { role: 'assistant', content: 'Mock response' },
					finish_reason: 'stop',
				},
			],
			usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
		});
	}),
];
