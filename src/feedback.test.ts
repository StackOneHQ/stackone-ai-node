import { http, HttpResponse } from 'msw';
import { server } from '../mocks/node';
import { StackOneError } from './utils/errors';
import { createFeedbackTool } from './feedback';

interface FeedbackResultItem {
	account_id: string;
	status: string;
	result?: unknown;
	error?: string;
}

interface FeedbackResult {
	message: string;
	total_accounts: number;
	successful: number;
	failed: number;
	results: FeedbackResultItem[];
}

describe('meta_collect_tool_feedback', () => {
	describe('validation tests', () => {
		it('test_missing_required_fields', async () => {
			const tool = createFeedbackTool();

			// Test missing account_id
			await expect(
				tool.execute({ feedback: 'Great tools!', tool_names: ['test_tool'] }),
			).rejects.toBeInstanceOf(StackOneError);

			// Test missing tool_names
			await expect(
				tool.execute({ feedback: 'Great tools!', account_id: 'acc_123456' }),
			).rejects.toBeInstanceOf(StackOneError);

			// Test missing feedback
			await expect(
				tool.execute({ account_id: 'acc_123456', tool_names: ['test_tool'] }),
			).rejects.toBeInstanceOf(StackOneError);
		});

		it('test_empty_and_whitespace_validation', async () => {
			const tool = createFeedbackTool();

			// Test empty feedback
			await expect(
				tool.execute({ feedback: '', account_id: 'acc_123456', tool_names: ['test_tool'] }),
			).rejects.toBeInstanceOf(StackOneError);

			// Test whitespace-only feedback
			await expect(
				tool.execute({ feedback: '   ', account_id: 'acc_123456', tool_names: ['test_tool'] }),
			).rejects.toBeInstanceOf(StackOneError);

			// Test empty account_id
			await expect(
				tool.execute({ feedback: 'Great tools!', account_id: '', tool_names: ['test_tool'] }),
			).rejects.toBeInstanceOf(StackOneError);

			// Test empty tool_names list
			await expect(
				tool.execute({ feedback: 'Great tools!', account_id: 'acc_123456', tool_names: [] }),
			).rejects.toBeInstanceOf(StackOneError);

			// Test tool_names with only whitespace
			await expect(
				tool.execute({
					feedback: 'Great tools!',
					account_id: 'acc_123456',
					tool_names: ['   ', '  '],
				}),
			).rejects.toBeInstanceOf(StackOneError);
		});

		it('test_multiple_account_ids_validation', async () => {
			const tool = createFeedbackTool();

			// Test empty account ID list
			await expect(
				tool.execute({
					feedback: 'Great tools!',
					account_id: [],
					tool_names: ['test_tool'],
				}),
			).rejects.toBeInstanceOf(StackOneError);

			// Test list with only empty strings
			await expect(
				tool.execute({
					feedback: 'Great tools!',
					account_id: ['', '   '],
					tool_names: ['test_tool'],
				}),
			).rejects.toBeInstanceOf(StackOneError);
		});

		it('test_json_string_input', async () => {
			const tool = createFeedbackTool();
			const recordedRequests: Request[] = [];
			const listener = ({ request }: { request: Request }) => {
				recordedRequests.push(request);
			};
			server.events.on('request:start', listener);

			// Test JSON string input
			const jsonInput = JSON.stringify({
				feedback: 'Great tools!',
				account_id: 'acc_123456',
				tool_names: ['test_tool'],
			});

			const result = await tool.execute(jsonInput);

			expect(recordedRequests).toHaveLength(1);
			expect(result).toMatchObject({
				message: 'Feedback sent to 1 account(s)',
				total_accounts: 1,
				successful: 1,
				failed: 0,
			});
			server.events.removeListener('request:start', listener);
		});
	});

	describe('execution tests', () => {
		it('test_single_account_execution', async () => {
			const tool = createFeedbackTool();
			const recordedRequests: Request[] = [];
			const listener = ({ request }: { request: Request }) => {
				recordedRequests.push(request);
			};
			server.events.on('request:start', listener);

			const result = await tool.execute({
				feedback: 'Great tools!',
				account_id: 'acc_123456',
				tool_names: ['data_export', 'analytics'],
			});

			expect(recordedRequests).toHaveLength(1);
			expect(recordedRequests[0]?.url).toBe('https://api.stackone.com/ai/tool-feedback');
			expect(recordedRequests[0]?.method).toBe('POST');
			// TODO: Remove type assertion once createFeedbackTool returns properly typed result instead of JsonDict
			const feedbackResult = result as unknown as FeedbackResult;
			expect(feedbackResult).toMatchObject({
				message: 'Feedback sent to 1 account(s)',
				total_accounts: 1,
				successful: 1,
				failed: 0,
			});
			expect(feedbackResult.results[0]).toMatchObject({
				account_id: 'acc_123456',
				status: 'success',
			});
			expect(feedbackResult.results[0].result).toHaveProperty(
				'message',
				'Feedback successfully stored',
			);
			server.events.removeListener('request:start', listener);
		});

		it('test_call_method_interface', async () => {
			const tool = createFeedbackTool();
			const recordedRequests: Request[] = [];
			const listener = ({ request }: { request: Request }) => {
				recordedRequests.push(request);
			};
			server.events.on('request:start', listener);

			// Test using the tool directly (equivalent to .call() in Python)
			const result = await tool.execute({
				feedback: 'Great tools!',
				account_id: 'acc_123456',
				tool_names: ['test_tool'],
			});

			expect(recordedRequests).toHaveLength(1);
			expect(result).toMatchObject({
				message: 'Feedback sent to 1 account(s)',
				total_accounts: 1,
				successful: 1,
				failed: 0,
			});
			server.events.removeListener('request:start', listener);
		});

		it('test_api_error_handling', async () => {
			const tool = createFeedbackTool();

			// Override the default handler to return an error
			server.use(
				http.post('https://api.stackone.com/ai/tool-feedback', () => {
					return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
				}),
			);

			await expect(
				tool.execute({
					feedback: 'Great tools!',
					account_id: 'acc_123456',
					tool_names: ['test_tool'],
				}),
			).rejects.toBeInstanceOf(StackOneError);
		});

		it('test_multiple_account_ids_execution', async () => {
			const tool = createFeedbackTool();

			// Test all accounts succeed
			const recordedRequests: Request[] = [];
			const listener = ({ request }: { request: Request }) => {
				recordedRequests.push(request);
			};
			server.events.on('request:start', listener);

			const result = await tool.execute({
				feedback: 'Great tools!',
				account_id: ['acc_123456', 'acc_789012', 'acc_345678'],
				tool_names: ['test_tool'],
			});

			expect(recordedRequests).toHaveLength(3);
			expect(result).toMatchObject({
				message: 'Feedback sent to 3 account(s)',
				total_accounts: 3,
				successful: 3,
				failed: 0,
			});
			server.events.removeListener('request:start', listener);

			// Test mixed success/error scenario
			let callCount = 0;
			server.use(
				http.post('https://api.stackone.com/ai/tool-feedback', () => {
					callCount++;
					if (callCount === 1) {
						return HttpResponse.json({ message: 'Success' });
					}
					return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
				}),
			);

			const mixedResult = await tool.execute({
				feedback: 'Great tools!',
				account_id: ['acc_123456', 'acc_789012'],
				tool_names: ['test_tool'],
			});

			expect(callCount).toBe(2);
			// TODO: Remove type assertion once createFeedbackTool returns properly typed result instead of JsonDict
			const mixedFeedbackResult = mixedResult as unknown as FeedbackResult;
			expect(mixedFeedbackResult).toMatchObject({
				message: 'Feedback sent to 2 account(s)',
				total_accounts: 2,
				successful: 1,
				failed: 1,
			});

			const successResult = mixedFeedbackResult.results.find((r) => r.account_id === 'acc_123456');
			const errorResult = mixedFeedbackResult.results.find((r) => r.account_id === 'acc_789012');

			expect(successResult).toMatchObject({
				account_id: 'acc_123456',
				status: 'success',
				result: { message: 'Success' },
			});
			expect(errorResult).toMatchObject({
				account_id: 'acc_789012',
				status: 'error',
				error: '{"error":"Unauthorized"}',
			});
		});

		it('test_tool_integration', async () => {
			// Test tool properties
			const tool = createFeedbackTool();
			expect(tool.name).toBe('meta_collect_tool_feedback');
			expect(tool.description).toContain('Collects user feedback');
			expect(tool.parameters).toBeDefined();

			// Test OpenAI function format conversion
			const openaiFormat = tool.toOpenAI();
			expect(openaiFormat).toMatchObject({
				type: 'function',
				function: {
					name: 'meta_collect_tool_feedback',
					description: expect.stringContaining('Collects user feedback'),
					parameters: expect.objectContaining({
						type: 'object',
						properties: expect.objectContaining({
							feedback: expect.any(Object),
							account_id: expect.any(Object),
							tool_names: expect.any(Object),
						}),
					}),
				},
			});
		});
	});
});
