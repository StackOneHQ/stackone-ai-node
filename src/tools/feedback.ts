import { z } from 'zod';
import { DEFAULT_BASE_URL } from '../consts';
import { BaseTool } from '../tool';
import type { ExecuteConfig, ExecuteOptions, JsonDict, ToolParameters } from '../types';
import { StackOneError } from '../utils/errors';

interface FeedbackToolOptions {
	baseUrl?: string;
	apiKey?: string;
	accountId?: string;
}

const createNonEmptyTrimmedStringSchema = (fieldName: string) =>
	z
		.string()
		.transform((value) => value.trim())
		.refine((value) => value.length > 0, {
			message: `${fieldName} must be a non-empty string.`,
		});

const feedbackInputSchema = z.object({
	feedback: createNonEmptyTrimmedStringSchema('Feedback'),
	account_id: z
		.union([
			createNonEmptyTrimmedStringSchema('Account ID'),
			z
				.array(createNonEmptyTrimmedStringSchema('Account ID'))
				.min(1, 'At least one account ID is required'),
		])
		.transform((value) => (Array.isArray(value) ? value : [value])),
	tool_names: z
		.array(z.string())
		.min(1, 'At least one tool name is required')
		.transform((value) => value.map((item) => item.trim()).filter((item) => item.length > 0))
		.refine((value) => value.length > 0, {
			message: 'Tool names must contain at least one non-empty string',
		}),
});

export function createFeedbackTool(
	apiKey?: string,
	accountId?: string,
	baseUrl = DEFAULT_BASE_URL,
): BaseTool {
	const options: FeedbackToolOptions = {
		apiKey,
		accountId,
		baseUrl,
	};
	const name = 'meta_collect_tool_feedback' as const;
	const description =
		'Collects user feedback on StackOne tool performance. First ask the user, "Are you ok with sending feedback to StackOne?" and mention that the LLM will take care of sending it. Call this tool only when the user explicitly answers yes.';
	const parameters = {
		type: 'object',
		properties: {
			account_id: {
				oneOf: [
					{
						type: 'string',
						description: 'Single account identifier (e.g., "acc_123456")',
					},
					{
						type: 'array',
						items: {
							type: 'string',
						},
						description: 'Array of account identifiers (e.g., ["acc_123456", "acc_789012"])',
					},
				],
				description: 'Account identifier(s) - can be a single string or array of strings',
			},
			feedback: {
				type: 'string',
				description: 'Verbatim feedback from the user about their experience with StackOne tools.',
			},
			tool_names: {
				type: 'array',
				items: {
					type: 'string',
				},
				description: 'Array of tool names being reviewed',
			},
		},
		required: ['feedback', 'account_id', 'tool_names'],
	} as const satisfies ToolParameters;

	const executeConfig = {
		kind: 'http',
		method: 'POST',
		url: '/ai/tool-feedback',
		bodyType: 'json',
		params: [],
	} as const satisfies ExecuteConfig;

	// Get API key from environment or options
	const resolvedApiKey = options.apiKey || process.env.STACKONE_API_KEY;

	// Create authentication headers
	const authHeaders: Record<string, string> = {};
	if (resolvedApiKey) {
		const authString = Buffer.from(`${resolvedApiKey}:`).toString('base64');
		authHeaders.Authorization = `Basic ${authString}`;
	}

	const tool = new BaseTool(name, description, parameters, executeConfig, authHeaders);
	const resolvedBaseUrl = options.baseUrl ?? DEFAULT_BASE_URL;

	tool.execute = async function (
		this: BaseTool,
		inputParams?: JsonDict | string,
		executeOptions?: ExecuteOptions,
	): Promise<JsonDict> {
		try {
			const rawParams =
				typeof inputParams === 'string' ? JSON.parse(inputParams) : inputParams || {};
			const parsedParams = feedbackInputSchema.parse(rawParams);

			const headers = {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				...this.getHeaders(),
			};

			// Handle dry run - show what would be sent to each account
			if (executeOptions?.dryRun) {
				const dryRunResults = parsedParams.account_id.map((accountId: string) => ({
					url: `${resolvedBaseUrl}${executeConfig.url}`,
					method: executeConfig.method,
					headers,
					body: {
						feedback: parsedParams.feedback,
						account_id: accountId,
						tool_names: parsedParams.tool_names,
					},
				}));

				return {
					multiple_requests: dryRunResults,
					total_accounts: parsedParams.account_id.length,
				} satisfies JsonDict;
			}

			// Send feedback to each account individually
			const results = [];
			const errors = [];

			for (const accountId of parsedParams.account_id) {
				try {
					const requestBody = {
						feedback: parsedParams.feedback,
						account_id: accountId,
						tool_names: parsedParams.tool_names,
					};

					const response = await fetch(`${resolvedBaseUrl}${executeConfig.url}`, {
						method: executeConfig.method satisfies 'POST',
						headers,
						body: JSON.stringify(requestBody),
					});

					const text = await response.text();
					let parsed: unknown;
					try {
						parsed = text ? JSON.parse(text) : {};
					} catch {
						parsed = { raw: text };
					}

					if (!response.ok) {
						errors.push({
							account_id: accountId,
							status: response.status,
							error:
								typeof parsed === 'object' && parsed !== null
									? JSON.stringify(parsed)
									: String(parsed),
						});
					} else {
						results.push({
							account_id: accountId,
							status: response.status,
							response: parsed,
						});
					}
				} catch (error) {
					errors.push({
						account_id: accountId,
						error: error instanceof Error ? error.message : String(error),
					});
				}
			}

			// Return summary of all submissions in Python SDK format
			const response: JsonDict = {
				message: `Feedback sent to ${parsedParams.account_id.length} account(s)`,
				total_accounts: parsedParams.account_id.length,
				successful: results.length,
				failed: errors.length,
				results: [
					...results.map((r) => ({
						account_id: r.account_id,
						status: 'success',
						result: r.response,
					})),
					...errors.map((e) => ({
						account_id: e.account_id,
						status: 'error',
						error: e.error,
					})),
				],
			};

			// If all submissions failed, throw an error
			if (errors.length > 0 && results.length === 0) {
				throw new StackOneError(
					`Failed to submit feedback to any account. Errors: ${JSON.stringify(errors)}`,
				);
			}

			return response;
		} catch (error) {
			if (error instanceof StackOneError) {
				throw error;
			}
			throw new StackOneError('Error executing tool', { cause: error });
		}
	};

	return tool;
}
