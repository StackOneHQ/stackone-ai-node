import { http } from 'msw';
import {
	accountMcpTools,
	createMcpApp,
	defaultMcpTools,
	exampleBamboohrTools,
	mixedProviderTools,
} from './mcp-server';

// Create MCP apps for testing
const defaultMcpApp = createMcpApp({
	accountTools: {
		default: defaultMcpTools,
		acc1: accountMcpTools.acc1,
		acc2: accountMcpTools.acc2,
		acc3: accountMcpTools.acc3,
		'test-account': accountMcpTools['test-account'],
		mixed: mixedProviderTools,
		// For examples testing
		'your-bamboohr-account-id': exampleBamboohrTools,
		'your-stackone-account-id': exampleBamboohrTools,
	},
});

/**
 * MCP Protocol endpoint handlers (delegated to Hono app)
 */
export const mcpHandlers = [
	http.all('https://api.stackone.com/mcp', async ({ request }) => {
		return defaultMcpApp.fetch(request);
	}),
	http.all('https://api.stackone-dev.com/mcp', async ({ request }) => {
		return defaultMcpApp.fetch(request);
	}),
];
