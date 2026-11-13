/**
 * Runs examples/openai-responses-integration.ts against the mock StackOne and OpenAI APIs.
 */

import { runExample, stubExampleEnv } from './run-example';

describe('openai-responses-integration example', () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('sends the list tools and prints the tool call the model makes', async () => {
		stubExampleEnv({ OPENAI_API_KEY: 'test-openai-key' });

		const { output, exitCode } = await runExample('openai-responses-integration');

		expect(exitCode).toBeUndefined();
		expect(output).toBe(
			[
				'Loaded 2 tools for OpenAI Responses API',
				'Response ID: resp_mock_tool_call',
				'Model: gpt-5',
				'Tool calls found: 1',
				'  Tool: workday_list_workers',
				'  Arguments: {"query":{"limit":5}}',
			].join('\n'),
		);
	});

	it('skips without OPENAI_API_KEY', async () => {
		stubExampleEnv({ OPENAI_API_KEY: '' });

		expect(await runExample('openai-responses-integration')).toEqual({
			output: 'Skipping: OPENAI_API_KEY is not set',
			exitCode: 0,
		});
	});
});
