import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import spawn from 'nano-spawn';

// Examples that require real API keys/LLM calls and should be skipped in CI/sandboxed runs
const SKIP_EXAMPLES = new Set([
  'openai-integration.ts',
  'ai-sdk-integration.ts',
  'human-in-the-loop.ts',
  'error-handling.ts',
  'fetch-tools.ts',
  'index.ts',
  'openapi-toolset.ts',
  'stackone-mcp-toolset.ts',
  'experimental-document-handling.ts',
]);

describe('Examples', () => {
  it('should run all example files without errors', async () => {
    const examplesDir = process.cwd();

    if (!fs.existsSync(examplesDir)) {
      throw new Error('Examples directory not found');
    }

    // Gather example files (exclude config and test files)
    let exampleFiles = fs
      .readdirSync(examplesDir)
      .filter(
        (fileName: string) =>
          fileName.endsWith('.ts') &&
          !fileName.includes('.spec.') &&
          !fileName.includes('.config.') &&
          !fileName.includes('.setup.')
      );

    // Skip examples that require real API keys/LLM calls (default: skip unless explicitly disabled)
    if (process.env.SKIP_LLM_EXAMPLES !== '0') {
      exampleFiles = exampleFiles.filter((f: string) => !SKIP_EXAMPLES.has(f));
    }

    expect(exampleFiles.length).toBeGreaterThan(0);

    const results = await Promise.all(
      exampleFiles.map(async (file: string) => {
        const filePath = path.join(examplesDir, file);

        try {
          // Run each example in a separate node process with --import tsx
          const result = await spawn('node', ['--import', 'tsx', filePath], {
            cwd: examplesDir,
            env: {
              ...process.env,
              OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? 'test-openai-key',
              STACKONE_API_KEY: process.env.STACKONE_API_KEY ?? 'test-stackone-key',
            },
          });
          return {
            file,
            success: true,
            exitCode: 0,
            stdout: result.stdout,
            stderr: result.stderr,
          };
        } catch (error) {
          const spawnError = error as { exitCode?: number; stdout?: string; stderr?: string };
          return {
            file,
            success: false,
            exitCode: spawnError.exitCode ?? 1,
            stdout: spawnError.stdout ?? '',
            stderr: spawnError.stderr ?? (error instanceof Error ? error.message : String(error)),
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
  }, 30000);
});
