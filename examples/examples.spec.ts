import { describe, expect, it } from 'bun:test';
import { $ } from 'bun';
import { directoryExists, joinPaths, listFilesInDirectory } from '../src/utils/file';

describe('Examples', () => {
  it(
    'should run all example files without errors',
    async () => {
      const examplesDir = joinPaths(process.cwd(), 'examples');

      if (!directoryExists(examplesDir)) {
        throw new Error('Examples directory not found');
      }

      const exampleFiles = listFilesInDirectory(
        examplesDir,
        (fileName) => fileName.endsWith('.ts') && !fileName.includes('.spec.')
      );

      expect(exampleFiles.length).toBeGreaterThan(0);

      const results = await Promise.all(
        exampleFiles.map(async (file) => {
          const filePath = joinPaths(examplesDir, file);

          try {
            const result = await $`bun run ${filePath}`.quiet();
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
