/**
 * Runs examples/auth-management.ts against the mock StackOne API.
 */

import { serveAccounts } from '../../mocks/node';
import { runExample, stubExampleEnv } from './run-example';

describe('auth-management example', () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('loads tools through every way of passing the key and the account', async () => {
		stubExampleEnv();
		// Discover the account that serves workday_list_workers, so section 5 overrides its account.
		serveAccounts([
			{ id: 'your-bamboohr-account-id', provider: 'bamboohr', status: 'active' },
			{ id: 'dead', provider: 'brokenprovider', status: 'error' },
		]);

		const { output, exitCode } = await runExample('auth-management');

		expect(exitCode).toBeUndefined();
		expect(output).toMatchInlineSnapshot(`
			"=== 1a. API Key from environment ===

			  Loaded 6 tools using env API key

			=== 1b. Explicit API key ===

			  Loaded 6 tools using explicit API key

			=== 1c. API key alone ===

			  2 linked account(s), 1 active
			  Loaded 6 tools across them

			=== 2. Account ID from environment ===

			  STACKONE_ACCOUNT_ID is set
			  Loaded 6 tools for account from env

			=== 3. Account ID in constructor ===

			  Loaded 6 tools for configured account

			=== 4. setAccounts() — global account list ===

			  Called setAccounts() with configured account
			  Loaded 6 tools after setAccounts()

			=== 5. Per-tool account override ===

			  Single tool account: "per-tool-account"

			Done — all auth patterns demonstrated."
		`);
	});

	it('exits 1 without STACKONE_API_KEY', async () => {
		stubExampleEnv({ STACKONE_API_KEY: '' });

		expect(await runExample('auth-management')).toEqual({
			output: '[error] Set STACKONE_API_KEY to run this example.',
			exitCode: 1,
		});
	});
});
