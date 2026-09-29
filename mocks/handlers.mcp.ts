import { http } from 'msw';
import { TEST_BASE_URL } from './constants';
import {
	accountMcpTools,
	createMcpApp,
	defaultMcpTools,
	exampleBamboohrTools,
	mixedProviderTools,
} from './mcp-server';

/** Every account the default mock knows. `/mcp` and `/actions/rpc` refuse any other with a 404. */
export const mockAccountTools = {
	default: defaultMcpTools,
	acc1: accountMcpTools.acc1,
	acc2: accountMcpTools.acc2,
	acc3: accountMcpTools.acc3,
	'test-account': accountMcpTools['test-account'],
	mixed: mixedProviderTools,
	// For examples testing
	'your-bamboohr-account-id': exampleBamboohrTools,
	'your-stackone-account-id': exampleBamboohrTools,
};

const defaultMcpApp = createMcpApp({ accountTools: mockAccountTools });

/**
 * MCP Protocol endpoint handlers (delegated to Hono app)
 */
export const mcpHandlers = [
	http.all(`${TEST_BASE_URL}/mcp`, async ({ request }) => {
		return defaultMcpApp.fetch(request);
	}),
];
