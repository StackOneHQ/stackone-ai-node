/**
 * Executes examples/anthropic-integration.ts.
 */

import { runExample, stubExampleEnv } from './run-example';

describe('anthropic-integration example', () => {
	beforeEach(() => {
		stubExampleEnv({ ANTHROPIC_API_KEY: 'test-anthropic-key' });
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('loads tools, calls Anthropic, and reports the tool use', async () => {
		const { stdout, exitCode } = await runExample('../../examples/anthropic-integration.ts');

		expect(exitCode).toBeUndefined();

		// 3: 2 tools matching the example's filters, plus the auto-appended tool_feedback.
		// A bare > 0 check cannot fail here — tool_feedback is appended after
		// filtering, so even a filter matching nothing still yields one tool.
		const loaded = stdout.match(/Loaded (\d+) tools/);
		expect(loaded).not.toBeNull();
		expect(Number(loaded?.[1])).toBe(3);

		expect(stdout).toContain('workday_list_workers');
	});

	it('skips cleanly when ANTHROPIC_API_KEY is absent', async () => {
		vi.stubEnv('ANTHROPIC_API_KEY', '');

		const { stdout, exitCode } = await runExample('../../examples/anthropic-integration.ts');

		expect(exitCode).toBe(0);
	});
});
