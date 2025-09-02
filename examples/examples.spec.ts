import { describe, expect, it } from 'bun:test';
import process from 'node:process';
import { $ } from 'bun';
import { directoryExists, joinPaths, listFilesInDirectory } from '../src/utils/file';

// Examples that require real LLM calls and should be skipped in CI/sandboxed runs
const LLM_EXAMPLES = new Set([
  'openai-integration.ts',
  'ai-sdk-integration.ts',
  'human-in-the-loop.ts',
]);

describe('Examples', () => {
  it(
    'should run all example files without errors',
    async () => {
      const examplesDir = joinPaths(process.cwd(), 'examples');

      if (!directoryExists(examplesDir)) {
        throw new Error('Examples directory not found');
      }

      // Gather example files
      let exampleFiles = listFilesInDirectory(
        examplesDir,
        (fileName: string) => fileName.endsWith('.ts') && !fileName.includes('.spec.')
      );

      // Optionally skip LLM-heavy examples when requested (default enabled via bun.test.setup.ts)
      if (process.env.SKIP_LLM_EXAMPLES === '1') {
        exampleFiles = exampleFiles.filter((f: string) => !LLM_EXAMPLES.has(f));
      }

      expect(exampleFiles.length).toBeGreaterThan(0);

      const results = await Promise.all(
        exampleFiles.map(async (file: string) => {
          const filePath = joinPaths(examplesDir, file);

          try {
            // Run each example in a separate Bun process but preload test setup
            // to activate MSW and load env vars. Also load .env explicitly.
            const result =
              await $`bun --preload ./bun.test.setup.ts --env-file .env run ${filePath}`.quiet();
            return {
              file,
              success: result.exitCode === 0,
              exitCode: result.exitCode,
              stdout: result.stdout?.toString() || '',
              stderr: result.stderr?.toString() || '',
            };
          } catch (error) {
            return {
              file,
              success: false,
              exitCode: 1,
              stdout: '',
              stderr: error instanceof Error ? error.message : String(error),
            };
          }
        })
      );

      const failedExamples = results.filter((result) => !result.success);

      if (failedExamples.length > 0) {
        const errorMessage = failedExamples
          .map(({ file, exitCode, stderr }) => `${file} (exit code: ${exitCode}): ${stderr}`)
          .join('\n');

        throw new Error(`Examples failed:\n${errorMessage}`);
      }

      expect(results.every((result) => result.success)).toBe(true);
    },
    { timeout: 30000 }
  );
});
