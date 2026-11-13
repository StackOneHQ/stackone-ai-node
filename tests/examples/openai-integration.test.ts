/**
 * Runs examples/openai-integration.ts against the mock StackOne and OpenAI APIs.
 */

import { EXAMPLE_ANSWER } from '../../mocks/handlers.utils';
import { recordToolCalls, runExample, stubExampleEnv } from './run-example';

describe('openai-integration example', () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('executes the tool the model calls and prints its answer', async () => {
		stubExampleEnv({ OPENAI_API_KEY: 'test-openai-key' });
		const calls = recordToolCalls();

		const { output, exitCode } = await runExample('openai-integration');

		expect(exitCode).toBeUndefined();
		expect(output).toBe(
			[
				'Loaded 3 tools for OpenAI',
				'Tool calls made: 1',
				'  Tool: workday_list_workers',
				'  Arguments: {"query":{"limit":5}}',
				`Answer: ${EXAMPLE_ANSWER}`,
			].join('\n'),
		);
		expect(calls.map(({ name, arguments: args }) => [name, args])).toEqual([
			['workday_list_workers', { query: { limit: 5 } }],
		]);
	});

	it('skips without OPENAI_API_KEY', async () => {
		stubExampleEnv({ OPENAI_API_KEY: '' });

		expect(await runExample('openai-integration')).toEqual({
			output: 'Skipping: OPENAI_API_KEY is not set',
			exitCode: 0,
		});
	});
});
