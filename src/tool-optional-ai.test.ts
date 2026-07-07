import { readFile } from 'node:fs/promises';
import { StackOneError } from './utils/error-stackone';
import { peerDependencies } from '../package.json';
import { ParameterLocation, type ExecuteConfig, type ToolParameters } from './types';

const createExecuteConfig = (): ExecuteConfig => ({
	kind: 'http',
	method: 'GET',
	url: 'https://api.example.com/test/{id}',
	bodyType: 'json',
	params: [
		{
			name: 'id',
			location: ParameterLocation.PATH,
			type: 'string',
		},
	],
});

const createParameters = (): ToolParameters => ({
	type: 'object',
	properties: { id: { type: 'string', description: 'ID parameter' } },
});

describe('BaseTool optional ai peer handling', () => {
	afterEach(() => {
		vi.resetModules();
		vi.restoreAllMocks();
	});

	it('rejects toClaudeAgentSdkTool with StackOneError and install hint when ai is unavailable', async () => {
		vi.doMock('./utils/try-import', () => ({
			tryImport: vi.fn(async (moduleName: string, installHint: string) => {
				if (moduleName === 'ai') {
					throw new StackOneError(
						`${moduleName} is not installed. Please install it with: ${installHint}`,
					);
				}

				throw new Error(`Unexpected module request: ${moduleName}`);
			}),
		}));

		const { BaseTool } = await import('./tool');
		const tool = new BaseTool('test_tool', 'Test tool', createParameters(), createExecuteConfig());

		await expect(tool.toClaudeAgentSdkTool()).rejects.toBeInstanceOf(StackOneError);
		await expect(tool.toClaudeAgentSdkTool()).rejects.toThrow(
			`ai is not installed. Please install it with: npm install ai (requires ${peerDependencies.ai})`,
		);
	});

	it('keeps the built module free of a top-level ai import', async () => {
		const builtToolModule = await readFile(
			new URL('../dist/src/tool.mjs', import.meta.url),
			'utf8',
		);

		expect(builtToolModule).toContain('tryImport("ai"');
		expect(builtToolModule).not.toMatch(/^\s*import\s+.*['"]ai['"]/m);
	});
});
