/**
 * Runs examples/auth-management.ts against the mock StackOne API.
 */

import { runExample, stubExampleEnv } from './run-example';

describe('auth-management example', () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('loads tools through every way of passing the key and the account', async () => {
		stubExampleEnv();

		const { output, exitCode } = await runExample('auth-management');

		expect(exitCode).toBeUndefined();
		expect(output.split('\n').filter((line) => line.startsWith('  '))).toEqual([
			'  Loaded 2 tools using env API key',
			'  Loaded 2 tools using explicit API key',
			'  2 linked account(s), 1 active',
			'  Loaded 2 tools across them',
			'  STACKONE_ACCOUNT_ID is set',
			'  Loaded 6 tools for account from env',
			'  Loaded 6 tools for configured account',
			'  Called setAccounts() with configured account',
			'  Loaded 6 tools after setAccounts()',
			// The discovered mock account serves no workday tools.
			'  (workday_list_workers not available — skipping single-tool demo)',
		]);
		expect(output).toMatch(/Done — all auth patterns demonstrated\.$/);
	});

	it('exits 1 without STACKONE_API_KEY', async () => {
		stubExampleEnv({ STACKONE_API_KEY: '' });

		expect(await runExample('auth-management')).toEqual({
			output: '[error] Set STACKONE_API_KEY to run this example.',
			exitCode: 1,
		});
	});
});
