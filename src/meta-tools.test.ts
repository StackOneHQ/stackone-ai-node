import { createExecuteTool, createSearchTool } from './meta-tools';
import { BaseTool, Tools } from './tool';
import type { ToolParameters } from './types';
import { StackOneAPIError } from './utils/error-stackone-api';

// --- Helpers ---

function createMockToolset(options?: { searchResults?: BaseTool[]; fetchResults?: BaseTool[] }): {
	toolset: { searchTools: ReturnType<typeof vi.fn>; fetchTools: ReturnType<typeof vi.fn> };
} {
	const mockTool = new BaseTool(
		'test_tool',
		'A test tool',
		{
			type: 'object',
			properties: {
				id: { type: 'string', description: 'The ID' },
				count: { type: 'integer', description: 'A count' },
			},
		} satisfies ToolParameters,
		{ kind: 'local', identifier: 'test:mock' },
	);

	const tools = new Tools(options?.searchResults ?? [mockTool]);
	const fetchTools = new Tools(options?.fetchResults ?? [mockTool]);

	return {
		toolset: {
			searchTools: vi.fn().mockResolvedValue(tools),
			fetchTools: vi.fn().mockResolvedValue(fetchTools),
		},
	};
}

// --- Tests ---

describe('createSearchTool', () => {
	it('returns a BaseTool named tool_search', () => {
		const { toolset } = createMockToolset();
		const tool = createSearchTool(toolset as never);
		expect(tool).toBeInstanceOf(BaseTool);
		expect(tool.name).toBe('tool_search');
	});

	it('delegates to toolset.searchTools', async () => {
		const { toolset } = createMockToolset();
		const tool = createSearchTool(toolset as never);

		await tool.execute({ query: 'find employees' });

		expect(toolset.searchTools).toHaveBeenCalledOnce();
		expect(toolset.searchTools).toHaveBeenCalledWith('find employees', expect.any(Object));
	});

	it('returns tool names, descriptions, and parameter properties', async () => {
		const { toolset } = createMockToolset();
		const tool = createSearchTool(toolset as never);

		const result = await tool.execute({ query: 'test' });

		expect(result.total).toBe(1);
		const tools = result.tools as Array<{
			name: string;
			description: string;
			parameters: Record<string, unknown>;
		}>;
		expect(tools[0].name).toBe('test_tool');
		expect(tools[0].description).toBe('A test tool');
		expect(tools[0].parameters).toHaveProperty('id');
	});

	it('passes connector and accountIds from options', async () => {
		const { toolset } = createMockToolset();
		const tool = createSearchTool(toolset as never, {
			connector: 'bamboohr',
			accountIds: ['acc-1'],
		});

		await tool.execute({ query: 'test' });

		const callOpts = toolset.searchTools.mock.calls[0][1];
		expect(callOpts.connector).toBe('bamboohr');
		expect(callOpts.accountIds).toEqual(['acc-1']);
	});

	it('does not hardcode topK fallback — lets searchTools default', async () => {
		const { toolset } = createMockToolset();
		const tool = createSearchTool(toolset as never);

		await tool.execute({ query: 'test' });

		const callOpts = toolset.searchTools.mock.calls[0][1];
		expect(callOpts.topK).toBeUndefined();
	});

	it('accepts string JSON arguments', async () => {
		const { toolset } = createMockToolset();
		const tool = createSearchTool(toolset as never);

		const result = await tool.execute(JSON.stringify({ query: 'employees' }));

		expect(result).toHaveProperty('tools');
		expect(toolset.searchTools).toHaveBeenCalledOnce();
	});

	it('returns error dict on invalid JSON', async () => {
		const { toolset } = createMockToolset();
		const tool = createSearchTool(toolset as never);

		const result = await tool.execute('not valid json');

		expect(result).toHaveProperty('error');
		expect(toolset.searchTools).not.toHaveBeenCalled();
	});

	it('returns error dict on validation failure', async () => {
		const { toolset } = createMockToolset();
		const tool = createSearchTool(toolset as never);

		const result = await tool.execute({ query: '' });

		expect(result).toHaveProperty('error');
		expect(toolset.searchTools).not.toHaveBeenCalled();
	});

	it('returns error dict on missing query', async () => {
		const { toolset } = createMockToolset();
		const tool = createSearchTool(toolset as never);

		const result = await tool.execute({});

		expect(result).toHaveProperty('error');
	});
});

describe('createExecuteTool', () => {
	it('returns a BaseTool named tool_execute', () => {
		const { toolset } = createMockToolset();
		const tool = createExecuteTool(toolset as never);
		expect(tool).toBeInstanceOf(BaseTool);
		expect(tool.name).toBe('tool_execute');
	});

	it('delegates to fetchTools and executes the target tool', async () => {
		const executeMock = vi.fn().mockResolvedValue({ result: 'ok' });
		const mockTarget = new BaseTool(
			'test_tool',
			'Test',
			{ type: 'object', properties: {} },
			{ kind: 'local', identifier: 'test:target' },
		);
		mockTarget.execute = executeMock;

		const { toolset } = createMockToolset({ fetchResults: [mockTarget] });
		const tool = createExecuteTool(toolset as never);

		const result = await tool.execute({ tool_name: 'test_tool', parameters: { id: '123' } });

		expect(result).toEqual({ result: 'ok' });
		expect(executeMock).toHaveBeenCalledOnce();
	});

	it('returns error when tool not found', async () => {
		const { toolset } = createMockToolset();
		const tool = createExecuteTool(toolset as never);

		const result = await tool.execute({ tool_name: 'nonexistent_tool' });

		expect(result).toHaveProperty('error');
		expect(result.error as string).toContain('not found');
	});

	it('returns API errors as error dict with response_body', async () => {
		const mockTarget = new BaseTool(
			'test_tool',
			'Test',
			{ type: 'object', properties: {} },
			{ kind: 'local', identifier: 'test:target' },
		);
		mockTarget.execute = vi
			.fn()
			.mockRejectedValue(new StackOneAPIError('Bad Request', 400, { message: 'Invalid params' }));

		const { toolset } = createMockToolset({ fetchResults: [mockTarget] });
		const tool = createExecuteTool(toolset as never);

		const result = await tool.execute({ tool_name: 'test_tool', parameters: {} });

		expect(result).toHaveProperty('error');
		expect(result.status_code).toBe(400);
		expect(result.tool_name).toBe('test_tool');
		expect(result.response_body).toEqual({ message: 'Invalid params' });
	});

	it('returns error dict on invalid JSON', async () => {
		const { toolset } = createMockToolset();
		const tool = createExecuteTool(toolset as never);

		const result = await tool.execute('not valid json');

		expect(result).toHaveProperty('error');
	});

	it('returns error dict on validation failure', async () => {
		const { toolset } = createMockToolset();
		const tool = createExecuteTool(toolset as never);

		const result = await tool.execute({ tool_name: '' });

		expect(result).toHaveProperty('error');
	});

	it('caches fetchTools calls', async () => {
		const mockTarget = new BaseTool(
			'test_tool',
			'Test',
			{ type: 'object', properties: {} },
			{ kind: 'local', identifier: 'test:target' },
		);
		mockTarget.execute = vi.fn().mockResolvedValue({ ok: true });

		const { toolset } = createMockToolset({ fetchResults: [mockTarget] });
		const tool = createExecuteTool(toolset as never);

		await tool.execute({ tool_name: 'test_tool' });
		await tool.execute({ tool_name: 'test_tool' });

		expect(toolset.fetchTools).toHaveBeenCalledOnce();
	});

	it('passes accountIds to fetchTools', async () => {
		const mockTarget = new BaseTool(
			'test_tool',
			'Test',
			{ type: 'object', properties: {} },
			{ kind: 'local', identifier: 'test:target' },
		);
		mockTarget.execute = vi.fn().mockResolvedValue({ ok: true });

		const { toolset } = createMockToolset({ fetchResults: [mockTarget] });
		const tool = createExecuteTool(toolset as never, { accountIds: ['acc-1'] });

		await tool.execute({ tool_name: 'test_tool' });

		expect(toolset.fetchTools).toHaveBeenCalledWith({ accountIds: ['acc-1'] });
	});

	it('accepts string JSON arguments', async () => {
		const mockTarget = new BaseTool(
			'test_tool',
			'Test',
			{ type: 'object', properties: {} },
			{ kind: 'local', identifier: 'test:target' },
		);
		mockTarget.execute = vi.fn().mockResolvedValue({ ok: true });

		const { toolset } = createMockToolset({ fetchResults: [mockTarget] });
		const tool = createExecuteTool(toolset as never);

		const result = await tool.execute(JSON.stringify({ tool_name: 'test_tool', parameters: {} }));

		expect(result).toEqual({ ok: true });
	});
});

describe('StackOneToolSet.openai()', () => {
	function createMockToolSetInstance(options?: {
		executeConfig?: { accountIds?: string[] };
		searchConfig?: Record<string, unknown>;
	}): {
		toolset: {
			fetchTools: ReturnType<typeof vi.fn>;
			getMetaTools: ReturnType<typeof vi.fn>;
			openai: (opts?: { mode?: 'search_and_execute'; accountIds?: string[] }) => Promise<unknown[]>;
		};
	} {
		const mockTool = new BaseTool(
			'test_tool',
			'A test tool',
			{ type: 'object', properties: {} } satisfies ToolParameters,
			{ kind: 'local', identifier: 'test:mock' },
		);
		const tools = new Tools([mockTool]);

		const metaSearchTool = new BaseTool(
			'tool_search',
			'Search for tools',
			{ type: 'object', properties: { query: { type: 'string' } } } satisfies ToolParameters,
			{ kind: 'local', identifier: 'meta:search' },
		);
		const metaExecuteTool = new BaseTool(
			'tool_execute',
			'Execute a tool',
			{ type: 'object', properties: { tool_name: { type: 'string' } } } satisfies ToolParameters,
			{ kind: 'local', identifier: 'meta:execute' },
		);
		const metaTools = new Tools([metaSearchTool, metaExecuteTool]);

		const fetchTools = vi.fn().mockResolvedValue(tools);
		const getMetaTools = vi.fn().mockReturnValue(metaTools);

		const executeConfig = options?.executeConfig;

		const toolset = {
			fetchTools,
			getMetaTools,
			async openai(opts?: { mode?: 'search_and_execute'; accountIds?: string[] }): Promise<unknown[]> {
				const effectiveAccountIds = opts?.accountIds ?? executeConfig?.accountIds;

				if (opts?.mode === 'search_and_execute') {
					return getMetaTools({ accountIds: effectiveAccountIds }).toOpenAI();
				}

				const fetchedTools = await fetchTools({ accountIds: effectiveAccountIds });
				return fetchedTools.toOpenAI();
			},
		};

		return { toolset };
	}

	it('default fetches all tools', async () => {
		const { toolset } = createMockToolSetInstance();

		const result = await toolset.openai();

		expect(toolset.fetchTools).toHaveBeenCalledOnce();
		expect(toolset.fetchTools).toHaveBeenCalledWith({ accountIds: undefined });
		expect(result).toHaveLength(1);
		expect(result[0]).toHaveProperty('type', 'function');
	});

	it('search_and_execute returns meta tools', async () => {
		const { toolset } = createMockToolSetInstance();

		const result = await toolset.openai({ mode: 'search_and_execute' });

		expect(toolset.getMetaTools).toHaveBeenCalledOnce();
		expect(toolset.fetchTools).not.toHaveBeenCalled();
		expect(result).toHaveLength(2);
	});

	it('passes accountIds to fetchTools', async () => {
		const { toolset } = createMockToolSetInstance();

		await toolset.openai({ accountIds: ['acc-1'] });

		expect(toolset.fetchTools).toHaveBeenCalledWith({ accountIds: ['acc-1'] });
	});

	it('uses executeConfig.accountIds as fallback', async () => {
		const { toolset } = createMockToolSetInstance({
			executeConfig: { accountIds: ['default-acc'] },
		});

		await toolset.openai();

		expect(toolset.fetchTools).toHaveBeenCalledWith({ accountIds: ['default-acc'] });
	});

	it('accountIds overrides executeConfig', async () => {
		const { toolset } = createMockToolSetInstance({
			executeConfig: { accountIds: ['default-acc'] },
		});

		await toolset.openai({ accountIds: ['override-acc'] });

		expect(toolset.fetchTools).toHaveBeenCalledWith({ accountIds: ['override-acc'] });
	});

	it('search_and_execute with executeConfig passes accountIds to getMetaTools', async () => {
		const { toolset } = createMockToolSetInstance({
			executeConfig: { accountIds: ['meta-acc'] },
		});

		await toolset.openai({ mode: 'search_and_execute' });

		expect(toolset.getMetaTools).toHaveBeenCalledWith({ accountIds: ['meta-acc'] });
	});
});
