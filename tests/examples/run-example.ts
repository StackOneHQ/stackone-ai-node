/**
 * Runs a real file from `examples/` against the mocks.
 *
 * An example does its work in top-level await, so importing it runs it. `STACKONE_BASE_URL` points
 * the toolset at the mock API, and `process.exit` throws instead of ending the vitest worker.
 */

import process from 'node:process';
import { http } from 'msw';
import { TEST_BASE_URL } from '../../mocks/constants';
import { mockAccountTools } from '../../mocks/handlers.mcp';
import { createMcpApp } from '../../mocks/mcp-server';
import type { MockMcpServerOptions, RecordedToolCall } from '../../mocks/mcp-server';
import { server } from '../../mocks/node';

/** An account the MCP mock serves the example tools for (mocks/handlers.mcp.ts). */
const EXAMPLE_ACCOUNT_ID = 'your-bamboohr-account-id';

interface ExampleRun {
	/** Everything the example printed, one console call per line, `console.error` prefixed. */
	output: string;
	/** The code the example passed to `process.exit`, or undefined when it ran to the end. */
	exitCode: number | undefined;
}

class ExampleExit extends Error {
	readonly code: number | undefined;

	constructor(code: number | undefined) {
		super(`example called process.exit(${code})`);
		this.code = code;
	}
}

/** Point every example at the mocks, with the given extra variables (an empty one unsets it). */
export function stubExampleEnv(extra: Record<string, string> = {}): void {
	vi.stubEnv('STACKONE_API_KEY', 'test-key');
	vi.stubEnv('STACKONE_ACCOUNT_ID', EXAMPLE_ACCOUNT_ID);
	vi.stubEnv('STACKONE_BASE_URL', TEST_BASE_URL);
	for (const [key, value] of Object.entries(extra)) {
		vi.stubEnv(key, value);
	}
}

/** Run `examples/<name>.ts` afresh and return what it printed and how it exited. */
export async function runExample(name: string): Promise<ExampleRun> {
	const lines: string[] = [];
	const spies = [
		vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
			lines.push(args.map(String).join(' '));
		}),
		vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
			lines.push(`[error] ${args.map(String).join(' ')}`);
		}),
		vi.spyOn(process, 'exit').mockImplementation((code) => {
			throw new ExampleExit(code === undefined || code === null ? undefined : Number(code));
		}),
	];

	let exitCode: number | undefined;
	try {
		// A fresh query string makes each run evaluate the module again instead of reusing the cache.
		await import(/* @vite-ignore */ `../../examples/${name}.ts?run=${crypto.randomUUID()}`);
	} catch (error) {
		if (!(error instanceof ExampleExit)) {
			throw error;
		}
		exitCode = error.code;
	} finally {
		for (const spy of spies) {
			spy.mockRestore();
		}
	}
	return { output: lines.join('\n'), exitCode };
}

/** Serve the default mock catalog with these options and record every `tools/call` made. */
export function recordToolCalls(
	options: Omit<MockMcpServerOptions, 'accountTools' | 'onToolCall'> = {},
): RecordedToolCall[] {
	const calls: RecordedToolCall[] = [];
	const app = createMcpApp({
		...options,
		accountTools: mockAccountTools,
		onToolCall: (call) => calls.push(call),
	});
	server.use(http.all(`${TEST_BASE_URL}/mcp`, ({ request }) => app.fetch(request)));
	return calls;
}
