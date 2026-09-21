/**
 * Executes examples/ai-sdk-integration.ts.
 */

import { runExample, stubExampleEnv } from './run-example';

describe('ai-sdk-integration example', () => {
	beforeEach(() => {
		stubExampleEnv({ OPENAI_API_KEY: 'test-openai-key' });
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('loads tools and drives a Vercel AI SDK generation', async () => {
		const { stdout, exitCode } = await runExample('../../examples/ai-sdk-integration.ts');

		expect(exitCode).toBeUndefined();

		// 4: 3 workday actions the example filters to, plus the auto-appended tool_feedback.
		// A bare > 0 check cannot fail here — tool_feedback is appended after
		// filtering, so even a filter matching nothing still yields one tool.
		const loaded = stdout.match(/Loaded (\d+) tools/);
		expect(loaded).not.toBeNull();
		expect(Number(loaded?.[1])).toBe(4);
	});

	it('skips cleanly when OPENAI_API_KEY is absent', async () => {
		vi.stubEnv('OPENAI_API_KEY', '');

		const { stdout, exitCode } = await runExample('../../examples/ai-sdk-integration.ts');

		expect(exitCode).toBe(0);
	});
});
