/**
 * Executes examples/openai-integration.ts.
 */

import { runExample, stubExampleEnv } from './run-example';

describe('openai-integration example', () => {
	beforeEach(() => {
		stubExampleEnv({ OPENAI_API_KEY: 'test-openai-key' });
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('loads tools, calls OpenAI, and reports the tool calls', async () => {
		const { stdout, exitCode } = await runExample('../../examples/openai-integration.ts');

		expect(exitCode).toBeUndefined();

		// A zero here would mean the action filter matched nothing and the example
		// sent OpenAI an empty tool list.
		// 4: 3 workday actions the example filters to, plus the auto-appended tool_feedback.
		// A bare > 0 check cannot fail here — tool_feedback is appended after
		// filtering, so even a filter matching nothing still yields one tool.
		const loaded = stdout.match(/Loaded (\d+) tools for OpenAI/);
		expect(loaded).not.toBeNull();
		expect(Number(loaded?.[1])).toBe(4);

		expect(stdout).toContain('Model returned 1 choice(s)');
		expect(stdout).toContain('Tool calls made: 1');
		expect(stdout).toContain('Tool: workday_list_workers');
	});

	it('skips cleanly when OPENAI_API_KEY is absent', async () => {
		vi.stubEnv('OPENAI_API_KEY', '');

		const { stdout, exitCode } = await runExample('../../examples/openai-integration.ts');

		expect(exitCode).toBe(0);
		expect(stdout).toContain('Skipping: OPENAI_API_KEY is not set');
	});
});
