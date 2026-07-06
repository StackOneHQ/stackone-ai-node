import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { publishConfig } from '../package.json';

const execFileAsync = promisify(execFile);

const rootDir = path.resolve(import.meta.dirname, '..');

// Typed wider than the current package.json shape so that a malformed exports
// map surfaces as a test failure rather than a compile error in this file.
const rootExport: string | { require?: string; import?: string } = publishConfig.exports['.'];
const conditions = typeof rootExport === 'string' ? { import: rootExport } : rootExport;
const cjsEntry = conditions.require ? path.resolve(rootDir, conditions.require) : undefined;
const esmEntry = conditions.import ? path.resolve(rootDir, conditions.import) : undefined;

const cjsReady = cjsEntry !== undefined && existsSync(cjsEntry);
const esmReady = esmEntry !== undefined && existsSync(esmEntry);

const PUBLIC_API_SAMPLE = ['StackOneToolSet', 'BaseTool', 'StackOneError'] as const;

const CONSUMER_SOURCE = [
	"import { StackOneToolSet } from '@stackone/ai';",
	'',
	"export const toolset = new StackOneToolSet({ apiKey: 'test' });",
	'',
].join('\n');

/**
 * Packs the project and unpacks it as `node_modules/@stackone/ai` of a minimal
 * consumer project inside `tempDir`, returning the consumer directory.
 *
 * Packing goes through `pnpm pack` because it applies the publishConfig
 * overrides (exports/main/types), producing the same package.json a consumer
 * gets from the registry. Lifecycle scripts are disabled: the prepack script
 * runs a full build, which must not happen inside the test.
 */
async function createConsumerFixture(tempDir: string): Promise<string> {
	await execFileAsync(
		'pnpm',
		['--config.ignore-scripts=true', 'pack', '--pack-destination', tempDir],
		{ cwd: rootDir },
	);
	const tarballName = (await readdir(tempDir)).find((file) => file.endsWith('.tgz'));
	if (!tarballName) {
		throw new Error('pnpm pack did not produce a tarball');
	}
	await execFileAsync('tar', ['-xzf', tarballName], { cwd: tempDir });

	const consumerDir = path.join(tempDir, 'consumer');
	const scopeDir = path.join(consumerDir, 'node_modules', '@stackone');
	await mkdir(scopeDir, { recursive: true });
	await rename(path.join(tempDir, 'package'), path.join(scopeDir, 'ai'));

	await writeFile(
		path.join(consumerDir, 'package.json'),
		JSON.stringify({ name: 'consumer', private: true }),
	);
	await writeFile(
		path.join(consumerDir, 'tsconfig.json'),
		JSON.stringify({
			compilerOptions: {
				module: 'node16',
				moduleResolution: 'node16',
				strict: true,
				noEmit: true,
				skipLibCheck: true,
			},
		}),
	);
	// The .cts consumer exercises CommonJS resolution and the .mts consumer
	// exercises ESM resolution under the Node16 tsconfig.
	await writeFile(path.join(consumerDir, 'consumer.cts'), CONSUMER_SOURCE);
	await writeFile(path.join(consumerDir, 'consumer.mts'), CONSUMER_SOURCE);
	return consumerDir;
}

/**
 * Verifies the published package is consumable from both CommonJS and ESM,
 * including TypeScript projects using Node16 module resolution.
 * Regression coverage for https://github.com/StackOneHQ/stackone-ai-node/issues/350.
 *
 * Tests that exercise the build output are skipped when `dist/` is missing
 * (run `pnpm build` first); CI always builds before testing.
 */
describe('published package output', () => {
	it('declares require and import conditions for the root export', () => {
		expect(conditions.require, 'publishConfig exports["."] must have a require condition').toMatch(
			/\.cjs$/,
		);
		expect(conditions.import, 'publishConfig exports["."] must have an import condition').toMatch(
			/\.mjs$/,
		);
	});

	it.skipIf(!cjsReady)('exposes the public API from the CJS entry via require()', () => {
		const requireFromTest = createRequire(import.meta.url);
		const moduleExports = requireFromTest(String(cjsEntry)) as Record<string, unknown>;
		for (const exportName of PUBLIC_API_SAMPLE) {
			expect(moduleExports[exportName], exportName).toBeTypeOf('function');
		}
	});

	it.skipIf(!esmReady)('exposes the public API from the ESM entry via import()', async () => {
		const moduleExports = (await import(pathToFileURL(String(esmEntry)).href)) as Record<
			string,
			unknown
		>;
		for (const exportName of PUBLIC_API_SAMPLE) {
			expect(moduleExports[exportName], exportName).toBeTypeOf('function');
		}
	});

	it.skipIf(!esmReady)(
		'type-checks for consumers using Node16 module resolution',
		async () => {
			const tempDir = await mkdtemp(path.join(tmpdir(), 'stackone-node16-'));
			try {
				const consumerDir = await createConsumerFixture(tempDir);
				try {
					// The consumer fixture has no TypeScript install of its own, so tsc
					// runs from the repository's pnpm context.
					await execFileAsync('pnpm', ['exec', 'tsc', '-p', consumerDir], { cwd: rootDir });
				} catch (error) {
					const execError = (error ?? {}) as { stdout?: unknown; stderr?: unknown };
					const details =
						`${String(execError.stdout ?? '')}${String(execError.stderr ?? '')}`.trim() ||
						String(error);
					throw new Error(`tsc failed for the Node16 consumer fixture:\n${details}`);
				}
			} finally {
				await rm(tempDir, { recursive: true, force: true });
			}
		},
		60_000,
	);
});
