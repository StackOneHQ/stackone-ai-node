/**
 * Interactive CLI Demo
 *
 * This example demonstrates how to build an interactive CLI tool using
 * @clack/prompts to dynamically discover and execute StackOne tools.
 *
 * Features:
 * - Interactive credential input with environment variable fallback
 * - Dynamic tool discovery and selection
 * - Spinner feedback during async operations
 *
 * Run with:
 * ```bash
 * npx tsx examples/interactive-cli.ts
 * ```
 */

import process from 'node:process';
import * as clack from '@clack/prompts';
import { StackOneToolSet } from '@stackone/ai';

// Enable verbose fetch logging when running with Bun
process.env.BUN_CONFIG_VERBOSE_FETCH = 'curl';

clack.intro('Welcome to StackOne AI Tool Tester');

// Check if environment variables are available
const hasEnvVars = process.env.STACKONE_API_KEY && process.env.STACKONE_ACCOUNT_ID;

let apiKey: string;
let baseUrl: string;
let accountId: string;

if (hasEnvVars) {
	const useEnv = await clack.confirm({
		message: 'Use environment variables from .env file?',
	});

	if (clack.isCancel(useEnv)) {
		clack.cancel('Operation cancelled');
		process.exit(0);
	}

	if (useEnv) {
		apiKey = process.env.STACKONE_API_KEY!;
		baseUrl = process.env.STACKONE_BASE_URL || 'https://api.stackone.com';
		accountId = process.env.STACKONE_ACCOUNT_ID!;
	} else {
		const credentials = await promptCredentials();
		apiKey = credentials.apiKey;
		baseUrl = credentials.baseUrl;
		accountId = credentials.accountId;
	}
} else {
	const credentials = await promptCredentials();
	apiKey = credentials.apiKey;
	baseUrl = credentials.baseUrl;
	accountId = credentials.accountId;
}

async function promptCredentials(): Promise<{
	apiKey: string;
	baseUrl: string;
	accountId: string;
}> {
	const apiKeyInput = await clack.text({
		message: 'Enter your StackOne API key:',
		placeholder: 'v1.us1.xxx...',
		validate: (value) => {
			if (!value) return 'API key is required';
		},
	});

	if (clack.isCancel(apiKeyInput)) {
		clack.cancel('Operation cancelled');
		process.exit(0);
	}

	const baseUrlInput = await clack.text({
		message: 'Enter StackOne Base URL (optional):',
		placeholder: 'https://api.stackone.com',
		defaultValue: 'https://api.stackone.com',
	});

	if (clack.isCancel(baseUrlInput)) {
		clack.cancel('Operation cancelled');
		process.exit(0);
	}

	const accountIdInput = await clack.text({
		message: 'Enter your StackOne Account ID:',
		placeholder: 'acc_xxx...',
		validate: (value) => {
			if (!value) return 'Account ID is required';
		},
	});

	if (clack.isCancel(accountIdInput)) {
		clack.cancel('Operation cancelled');
		process.exit(0);
	}

	return {
		apiKey: apiKeyInput as string,
		baseUrl: baseUrlInput as string,
		accountId: accountIdInput as string,
	};
}

const spinner = clack.spinner();
spinner.start('Initialising StackOne client...');

const toolset = new StackOneToolSet({
	apiKey,
	baseUrl,
	accountId,
});

spinner.message('Fetching available tools...');
const tools = await toolset.fetchTools();
const allTools = tools.toArray();
spinner.stop(`Found ${allTools.length} tools`);

// Select a tool interactively
const selectedToolName = await clack.select({
	message: 'Select a tool to execute:',
	options: allTools.map((tool) => ({
		label: tool.description,
		value: tool.name,
		hint: tool.name,
	})),
});

if (clack.isCancel(selectedToolName)) {
	clack.cancel('Operation cancelled');
	process.exit(0);
}

const selectedTool = tools.getTool(selectedToolName as string);
if (!selectedTool) {
	clack.log.error(`Tool '${selectedToolName}' not found!`);
	process.exit(1);
}

spinner.start(`Executing: ${selectedTool.description}`);
try {
	const result = await selectedTool.execute({
		query: { limit: 5 },
	});
	spinner.stop('Execution complete');

	clack.log.success('Result:');
	console.log(JSON.stringify(result, null, 2));
	clack.outro('Done!');
} catch (error) {
	spinner.stop('Execution failed');
	clack.log.error(error instanceof Error ? error.message : String(error));
	clack.outro('Failed');
	process.exit(1);
}
