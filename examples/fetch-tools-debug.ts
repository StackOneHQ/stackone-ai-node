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
 * node --env-files=.env examples/interactive-cli.ts
 * ```
 */

import process from 'node:process';
import * as clack from '@clack/prompts';
import { StackOneToolSet } from '@stackone/ai';

/**
 * Mask a sensitive value, showing only the first few and last few characters
 */
function maskValue(value: string, visibleStart = 4, visibleEnd = 4): string {
	if (value.length <= visibleStart + visibleEnd) {
		return '*'.repeat(value.length);
	}
	const start = value.slice(0, visibleStart);
	const end = value.slice(-visibleEnd);
	const masked = '*'.repeat(Math.min(value.length - visibleStart - visibleEnd, 8));
	return `${start}${masked}${end}`;
}

clack.intro('Welcome to StackOne AI Tool Tester');

// Get API key
let apiKey: string;
const envApiKey = process.env.STACKONE_API_KEY;
if (envApiKey) {
	const apiKeyChoice = await clack.select({
		message: 'StackOne API Key:',
		options: [
			{ value: 'env', label: 'Use environment variable', hint: maskValue(envApiKey) },
			{ value: 'input', label: 'Enter manually' },
		],
	});

	if (clack.isCancel(apiKeyChoice)) {
		clack.cancel('Operation cancelled');
		process.exit(0);
	}

	if (apiKeyChoice === 'env') {
		apiKey = envApiKey;
	} else {
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

		apiKey = apiKeyInput;
	}
} else {
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

	apiKey = apiKeyInput;
}

// Get base URL
let baseUrl: string;
const envBaseUrl = process.env.STACKONE_BASE_URL;
if (envBaseUrl) {
	const baseUrlChoice = await clack.select({
		message: 'StackOne Base URL:',
		options: [
			{ value: 'env', label: 'Use environment variable', hint: maskValue(envBaseUrl, 8, 8) },
			{ value: 'input', label: 'Enter manually' },
		],
	});

	if (clack.isCancel(baseUrlChoice)) {
		clack.cancel('Operation cancelled');
		process.exit(0);
	}

	if (baseUrlChoice === 'env') {
		baseUrl = envBaseUrl;
	} else {
		const baseUrlInput = await clack.text({
			message: 'Enter StackOne Base URL:',
			placeholder: 'https://api.stackone.com',
			defaultValue: 'https://api.stackone.com',
		});

		if (clack.isCancel(baseUrlInput)) {
			clack.cancel('Operation cancelled');
			process.exit(0);
		}

		baseUrl = baseUrlInput;
	}
} else {
	const baseUrlInput = await clack.text({
		message: 'Enter StackOne Base URL (optional):',
		placeholder: 'https://api.stackone.com',
		defaultValue: 'https://api.stackone.com',
	});

	if (clack.isCancel(baseUrlInput)) {
		clack.cancel('Operation cancelled');
		process.exit(0);
	}

	baseUrl = baseUrlInput;
}

// Get account ID
let accountId: string;
const envAccountId = process.env.STACKONE_ACCOUNT_ID;
if (envAccountId) {
	const accountIdChoice = await clack.select({
		message: 'StackOne Account ID:',
		options: [
			{ value: 'env', label: 'Use environment variable', hint: maskValue(envAccountId) },
			{ value: 'input', label: 'Enter manually' },
		],
	});

	if (clack.isCancel(accountIdChoice)) {
		clack.cancel('Operation cancelled');
		process.exit(0);
	}

	if (accountIdChoice === 'env') {
		accountId = envAccountId;
	} else {
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

		accountId = accountIdInput as string;
	}
} else {
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

	accountId = accountIdInput as string;
}

// @ts-expect-error Bun global is not in Node.js types
if ((typeof globalThis.Bun as any) !== 'undefined') {
	const detailedLog = await clack.confirm({
		message: 'Enable detailed logging? (recommended for Bun.js users)',
	});

	if (clack.isCancel(detailedLog)) {
		clack.cancel('Operation cancelled');
		process.exit(0);
	}

	if (detailedLog) {
		process.env.BUN_CONFIG_VERBOSE_FETCH = 'curl';
	}
}

const spinner = clack.spinner();
spinner.start('Initializing StackOne client...');

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

	// Display result based on its structure
	if (Array.isArray(result)) {
		// For array results, use console.table for better readability
		if (result.length > 0 && typeof result[0] === 'object') {
			console.table(result);
		} else {
			console.log(result);
		}
	} else if (result && typeof result === 'object') {
		// Check if result has a data array property (common API response pattern)
		const data = (result as Record<string, unknown>).data;
		if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
			console.log('\nData:');
			console.table(data);

			// Show other properties
			const otherProps = Object.fromEntries(
				Object.entries(result as Record<string, unknown>).filter(([key]) => key !== 'data'),
			);
			if (Object.keys(otherProps).length > 0) {
				console.log('\nMetadata:');
				console.log(JSON.stringify(otherProps, null, 2));
			}
		} else {
			console.log(JSON.stringify(result, null, 2));
		}
	} else {
		console.log(result);
	}

	clack.outro('Done!');
} catch (error) {
	spinner.stop('Execution failed');

	if (error instanceof Error) {
		clack.log.error(`Error: ${error.message}`);
		if (error.cause) {
			clack.log.info(`Cause: ${JSON.stringify(error.cause, null, 2)}`);
		}
		if (error.stack) {
			clack.log.info(`Stack trace:\n${error.stack}`);
		}
	} else {
		clack.log.error(`Error: ${JSON.stringify(error, null, 2)}`);
	}

	clack.outro('Failed');
	process.exit(1);
}
