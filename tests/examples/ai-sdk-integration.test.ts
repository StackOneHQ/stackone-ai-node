/**
 * Runs examples/ai-sdk-integration.ts against the mock StackOne and OpenAI APIs.
 */

import { EXAMPLE_ANSWER } from '../../mocks/handlers.utils';
import { recordToolCalls, runExample, stubExampleEnv } from './run-example';

describe('ai-sdk-integration example', () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('lets the AI SDK execute the tool, then prints the answer', async () => {
		stubExampleEnv({ OPENAI_API_KEY: 'test-openai-key' });
		const calls = recordToolCalls();

		const { output, exitCode } = await runExample('ai-sdk-integration');

		expect(exitCode).toBeUndefined();
		expect(output).toBe(
			[
				'Loaded 3 tools for AI SDK',
				`AI response: ${EXAMPLE_ANSWER}`,
				'Steps taken: 2',
				'  Tool call: workday_list_workers',
				'  Arguments: {"query":{"limit":5}}',
			].join('\n'),
		);
		expect(calls.map(({ name, arguments: args }) => [name, args])).toEqual([
			['workday_list_workers', { query: { limit: 5 } }],
		]);
	});

	it('skips without OPENAI_API_KEY', async () => {
		stubExampleEnv({ OPENAI_API_KEY: '' });

		expect(await runExample('ai-sdk-integration')).toEqual({
			output: 'Skipping: OPENAI_API_KEY is not set',
			exitCode: 0,
		});
	});
});
