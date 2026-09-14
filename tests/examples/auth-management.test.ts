/**
 * Executes examples/auth-management.ts.
 */

import { runExample, stubExampleEnv } from './run-example';

describe('auth-management example', () => {
	beforeEach(() => {
		stubExampleEnv();
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('runs every auth pattern to completion', async () => {
		const { stdout, exitCode } = await runExample('../../examples/auth-management.ts');

		expect(exitCode).toBeUndefined();
		expect(stdout).toContain('Done — all auth patterns demonstrated.');
	});

	it('loads tools through each configuration path', async () => {
		const { stdout } = await runExample('../../examples/auth-management.ts');

		for (const section of [
			'1a. API Key from environment',
			'1b. Explicit API key',
			'2. Account ID from environment',
			'3. Account ID in constructor',
			'4. setAccounts() — global account list',
			'5. Per-tool account override',
		]) {
			expect(stdout).toContain(section);
		}

		// Every fetchTools() call must return a non-empty toolset; "Loaded 0 tools"
		// would mean the example ran but silently exercised nothing.
		const loaded = [...stdout.matchAll(/Loaded (\d+) tools/g)].map((match) => Number(match[1]));
		expect(loaded.length).toBeGreaterThan(0);
		expect(loaded.every((count) => count > 0)).toBe(true);
	});

	it('exits non-zero when STACKONE_API_KEY is absent', async () => {
		vi.stubEnv('STACKONE_API_KEY', '');

		const { exitCode } = await runExample('../../examples/auth-management.ts');

		expect(exitCode).toBe(1);
	});
});
