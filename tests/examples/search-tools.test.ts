/**
 * Executes examples/search-tools.ts.
 */

import { http, HttpResponse } from 'msw';
import { TEST_BASE_URL } from '../../mocks/constants';
import { server } from '../../mocks/node';
import { runExample, stubExampleEnv } from './run-example';

describe('search-tools example', () => {
	beforeEach(() => {
		stubExampleEnv({ OPENAI_API_KEY: 'test-openai-key' });

		// Scoped rather than a global handler: src/semantic-search.test.ts asserts
		// against an unmocked /actions/search and a default would pre-empt it.
		server.use(
			http.post(`${TEST_BASE_URL}/actions/search`, async ({ request }) => {
				const body = (await request.json()) as { query?: string; top_k?: number };
				const candidates = [
					'workday_list_workers',
					'workday_get_worker',
					'workday_get_current_user',
					'bamboohr_list_employees',
				];
				const results = candidates
					.slice(0, body.top_k ?? candidates.length)
					.map((id, index) => ({ id, similarity_score: 1 - index * 0.1 }));

				return HttpResponse.json({
					results,
					total_count: results.length,
					query: body.query ?? '',
				});
			}),
		);
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('runs every discovery mode to completion', async () => {
		const { stdout, exitCode } = await runExample('../../examples/search-tools.ts');

		expect(exitCode).toBeUndefined();

		for (const section of [
			'1. Direct Fetch (action filters)',
			'2. Semantic Search',
			'3. Local Search (BM25 + TF-IDF)',
			'4. Auto Search + getSearchTool() Callable',
		]) {
			expect(stdout).toContain(section);
		}
	});

	it('fetches tools matching the workday glob', async () => {
		const { stdout } = await runExample('../../examples/search-tools.ts');

		const fetched = stdout.match(/Fetched (\d+) tools matching "workday_\*"/);
		expect(fetched).not.toBeNull();
		expect(Number(fetched?.[1])).toBeGreaterThan(0);
	});

	it('exits non-zero without STACKONE_ACCOUNT_ID', async () => {
		vi.stubEnv('STACKONE_ACCOUNT_ID', '');

		const { stdout, exitCode } = await runExample('../../examples/search-tools.ts');

		expect(exitCode).toBe(1);
	});
});
