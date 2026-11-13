/**
 * E2E test for search-and-execute.ts example
 *
 * Runs the real example file against the mock API: an API key and nothing else, so it has to
 * discover the account, search, execute the best hit and try to record feedback.
 */

import { TEST_BASE_URL } from '../../mocks/constants';
import { MOCK_SEARCH_SESSION_ID } from '../../mocks/mcp-server';
import { StackOneToolSet, ToolSetLoadError } from '../../src';
import { recordToolCalls, runExample } from './run-example';

describe('search-and-execute example e2e', () => {
	beforeEach(() => {
		vi.stubEnv('STACKONE_API_KEY', 'test-key');
		vi.stubEnv('STACKONE_BASE_URL', TEST_BASE_URL);
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('runs the example end to end', async () => {
		const calls = recordToolCalls({ submitFeedback: true });

		const { output, exitCode } = await runExample('search-and-execute');

		expect(exitCode).toBeUndefined();
		expect(output).toContain('default  testprovider  active');
		expect(output).toContain('0.800  mock_list_items  [default]');
		expect(output).toContain('Feedback recorded.');
		expect(
			calls.map((call) => [
				call.name,
				call.arguments.stackone_account_id,
				call.arguments.session_id,
			]),
		).toEqual([
			// One account: the server's pair, its stackone_account_id dropped as the pair's own.
			['mock_default_search_actions', undefined, undefined],
			['mock_default_execute_action', undefined, MOCK_SEARCH_SESSION_ID],
			['stackone_submit_feedback', undefined, MOCK_SEARCH_SESSION_ID],
		]);
	});

	it('reports feedback as unavailable when the project has it off', async () => {
		const toolset = new StackOneToolSet();

		const [best] = await toolset.search('list recent comments', { topK: 3 });
		assert(best !== undefined);
		expect(await toolset.execute(best.action_id, {}, { sessionId: best.session_id })).toMatchObject(
			{ isError: false, result: { data: { nodes: [] } } },
		);
		await expect(
			toolset.submitFeedback({ rating: 'positive', toolNames: [best.action_id] }),
		).rejects.toBeInstanceOf(ToolSetLoadError);
	});
});
