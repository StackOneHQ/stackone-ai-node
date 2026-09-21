/**
 * Executes a real file from `examples/` under MSW.
 *
 * Examples run their work at import time via top-level await, so importing one
 * *is* running it. Two things make that safe under vitest:
 *
 *   - `STACKONE_BASE_URL` points the SDK at the mock (toolsets.ts reads it), so
 *     examples that construct `new StackOneToolSet()` with no explicit baseUrl
 *     still hit MSW rather than production.
 *   - `process.exit` is swapped for a throw. An example that bails on missing
 *     config would otherwise tear down the whole vitest worker, turning a real
 *     failure into a confusing crash.
 */

import process from 'node:process';
import { TEST_BASE_URL } from '../../mocks/constants';

/** Account id the MCP mock serves example tools for (mocks/handlers.mcp.ts). */
export const EXAMPLE_ACCOUNT_ID = 'your-bamboohr-account-id';

export interface ExampleRun {
	stdout: string;
	exitCode: number | undefined;
}

export class ExampleExitError extends Error {
	constructor(readonly code: number | undefined) {
		super(`example called process.exit(${code})`);
		this.name = 'ExampleExitError';
	}
}

/**
 * Import and execute an example, capturing its console output.
 *
 * @param specifier module specifier relative to this file, e.g. `../../examples/auth-management.ts`
 */
export async function runExample(specifier: string): Promise<ExampleRun> {
	const lines: string[] = [];
	const record =
		(stream: 'log' | 'error') =>
		(...args: unknown[]): void => {
			lines.push(`${stream === 'error' ? '[stderr] ' : ''}${args.map(String).join(' ')}`);
		};

	const logSpy = vi.spyOn(console, 'log').mockImplementation(record('log'));
	const errorSpy = vi.spyOn(console, 'error').mockImplementation(record('error'));

	let exitCode: number | undefined;
	const realExit = process.exit;
	// biome-ignore lint/suspicious/noExplicitAny: process.exit's never-returning signature
	process.exit = ((code?: number): never => {
		exitCode = code;
		throw new ExampleExitError(code);
	}) as any;

	try {
		// Query param busts vite's module cache so each test executes the example
		// afresh rather than replaying the first import's side effects.
		await import(/* @vite-ignore */ `${specifier}?run=${crypto.randomUUID()}`);
	} catch (error) {
		// An example bailing via process.exit is a normal outcome to assert on, not
		// a harness failure — surface it as `exitCode` with its output intact.
		if (!(error instanceof ExampleExitError)) {
			throw error;
		}
	} finally {
		process.exit = realExit;
		logSpy.mockRestore();
		errorSpy.mockRestore();
	}

	return { stdout: lines.join('\n'), exitCode };
}

/** Env every example needs to reach the mock instead of production. */
export function stubExampleEnv(extra: Record<string, string> = {}): void {
	vi.stubEnv('STACKONE_API_KEY', 'test-key');
	vi.stubEnv('STACKONE_ACCOUNT_ID', EXAMPLE_ACCOUNT_ID);
	vi.stubEnv('STACKONE_BASE_URL', TEST_BASE_URL);
	for (const [key, value] of Object.entries(extra)) {
		vi.stubEnv(key, value);
	}
}
