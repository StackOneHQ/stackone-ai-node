/**
 * E2E test for search-and-execute.ts example
 *
 * Runs the real example file against the mock API: an API key and nothing else, so it has to
 * discover the account, search, execute the best hit and try to record feedback.
 */

import { http } from 'msw';
import { TEST_BASE_URL } from '../../mocks/constants';
import { mockAccountTools } from '../../mocks/handlers.mcp';
import {
	type RecordedToolCall,
	MOCK_SEARCH_SESSION_ID,
	createMcpApp,
} from '../../mocks/mcp-server';
import { server } from '../../mocks/node';
import { StackOneToolSet, ToolSetLoadError } from '../../src';

describe('search-and-execute example e2e', () => {
	beforeEach(() => {
		vi.stubEnv('STACKONE_API_KEY', 'test-key');
		vi.stubEnv('STACKONE_BASE_URL', TEST_BASE_URL);
	});

	afterEach(() => {
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
	});

	it('runs the example end to end', async () => {
		const calls: RecordedToolCall[] = [];
		const app = createMcpApp({
			accountTools: mockAccountTools,
			submitFeedback: true,
			onToolCall: (call) => calls.push(call),
		});
		server.use(http.all(`${TEST_BASE_URL}/mcp`, ({ request }) => app.fetch(request)));
		const log = vi.spyOn(console, 'log').mockImplementation(() => {});

		await import('../../examples/search-and-execute');

		const printed = log.mock.calls.map((args) => String(args[0])).join('\n');
		expect(printed).toContain('default  testprovider  active');
		expect(printed).toContain('0.800  mock_list_items');
		expect(printed).toContain('Feedback recorded.');
		expect(calls.map((call) => [call.name, call.arguments.session_id])).toEqual([
			['mock_default_search_actions', undefined],
			['mock_default_execute_action', MOCK_SEARCH_SESSION_ID],
			['stackone_submit_feedback', MOCK_SEARCH_SESSION_ID],
		]);
	});

	it('reports feedback as unavailable when the project has it off', async () => {
		const toolset = new StackOneToolSet();

		const [best] = await toolset.search('list recent comments', { topK: 3 });
		assert(best);
		expect(await toolset.execute(best.action_id, {}, { sessionId: best.session_id })).toMatchObject(
			{ isError: false, result: { data: { nodes: [] } } },
		);
		await expect(
			toolset.submitFeedback({ rating: 'positive', toolNames: [best.action_id] }),
		).rejects.toBeInstanceOf(ToolSetLoadError);
	});
});
