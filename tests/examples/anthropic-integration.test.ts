/**
 * Runs examples/anthropic-integration.ts against the mock StackOne and Anthropic APIs.
 */

import { runExample, stubExampleEnv } from './run-example';

describe('anthropic-integration example', () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('sends the list and search tools and prints the tool use the model returns', async () => {
		stubExampleEnv({ ANTHROPIC_API_KEY: 'test-anthropic-key' });

		const { output, exitCode } = await runExample('anthropic-integration');

		expect(exitCode).toBeUndefined();
		expect(output).toBe(
			[
				'Loaded 2 tools for Anthropic',
				'Response content blocks: 1',
				'  Tool use: workday_list_workers',
				'  Input: {"query":{"limit":5}}',
			].join('\n'),
		);
	});

	it('skips without ANTHROPIC_API_KEY', async () => {
		stubExampleEnv({ ANTHROPIC_API_KEY: '' });

		expect(await runExample('anthropic-integration')).toEqual({
			output: 'Skipping: ANTHROPIC_API_KEY is not set',
			exitCode: 0,
		});
	});
});
