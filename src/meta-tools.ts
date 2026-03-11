import { z } from 'zod/v4';
import { BaseTool } from './tool';
import type { ExecuteOptions, JsonObject, LocalExecuteConfig, ToolParameters } from './types';
import { StackOneError } from './utils/error-stackone';
import { StackOneAPIError } from './utils/error-stackone-api';

import type { SearchMode, StackOneToolSet } from './toolsets';

/**
 * Options for getMetaTools().
 */
export interface MetaToolsOptions {
	/** Account IDs to scope tool discovery and execution */
	accountIds?: string[];
	/** Search mode for tool discovery */
	search?: SearchMode;
	/** Optional connector filter (e.g. 'bamboohr') */
	connector?: string;
	/** Maximum number of search results. Defaults to 5. */
	topK?: number;
	/** Minimum similarity score threshold 0-1 */
	minSimilarity?: number;
}

const localConfig = (id: string): LocalExecuteConfig => ({
	kind: 'local',
	identifier: `meta:${id}`,
});

// --- tool_search ---

const searchInputSchema = z.object({
	query: z
		.string()
		.transform((v) => v.trim())
		.refine((v) => v.length > 0, { message: 'query must be a non-empty string' }),
	connector: z.string().optional(),
	top_k: z.number().int().min(1).max(50).optional(),
});

const searchParameters = {
	type: 'object',
	properties: {
		query: {
			type: 'string',
			description:
				'Natural language description of what you need (e.g. "create an employee", "list time off requests")',
		},
		connector: {
			type: 'string',
			description: 'Optional connector filter (e.g. "bamboohr", "hibob")',
		},
		top_k: {
			type: 'integer',
			description: 'Max results to return (1-50, default 5)',
			minimum: 1,
			maximum: 50,
		},
	},
	required: ['query'],
} as const satisfies ToolParameters;

export function createSearchTool(toolset: StackOneToolSet, options: MetaToolsOptions = {}): BaseTool {
	const tool = new BaseTool(
		'tool_search',
		'Search for available tools by describing what you need. Returns matching tool names, descriptions, and parameter schemas. Use the returned parameter schemas to know exactly what to pass when calling tool_execute.',
		searchParameters,
		localConfig('search'),
	);

	tool.execute = async (inputParams?: JsonObject | string): Promise<JsonObject> => {
		const raw = typeof inputParams === 'string' ? JSON.parse(inputParams) : inputParams || {};
		const parsed = searchInputSchema.parse(raw);

		const results = await toolset.searchTools(parsed.query, {
			connector: parsed.connector ?? options.connector,
			topK: parsed.top_k ?? options.topK ?? 5,
			minSimilarity: options.minSimilarity,
			search: options.search,
			accountIds: options.accountIds,
		});

		return {
			tools: results.toArray().map((t) => ({
				name: t.name,
				description: t.description,
				parameters: t.parameters.properties,
			})),
			total: results.length,
			query: parsed.query,
		};
	};

	return tool;
}

// --- tool_execute ---

const executeInputSchema = z.object({
	tool_name: z
		.string()
		.transform((v) => v.trim())
		.refine((v) => v.length > 0, { message: 'tool_name must be a non-empty string' }),
	parameters: z.record(z.string(), z.unknown()).optional().default({}),
});

const executeParameters = {
	type: 'object',
	properties: {
		tool_name: {
			type: 'string',
			description: 'Exact tool name from tool_search results',
		},
		parameters: {
			type: 'object',
			description: 'Parameters for the tool. Pass an empty object {} if no parameters are needed.',
		},
	},
	required: ['tool_name'],
} as const satisfies ToolParameters;

export function createExecuteTool(toolset: StackOneToolSet, options: MetaToolsOptions = {}): BaseTool {
	const tool = new BaseTool(
		'tool_execute',
		'Execute a tool by name with the given parameters. Use tool_search first to find available tools. The parameters field must match the parameter schema returned by tool_search. Pass parameters as a nested object matching the schema structure.',
		executeParameters,
		localConfig('execute'),
	);

	tool.execute = async (
		inputParams?: JsonObject | string,
		executeOptions?: ExecuteOptions,
	): Promise<JsonObject> => {
		const raw = typeof inputParams === 'string' ? JSON.parse(inputParams) : inputParams || {};
		const parsed = executeInputSchema.parse(raw);

		const allTools = await toolset.fetchTools({ accountIds: options.accountIds });
		const target = allTools.getTool(parsed.tool_name);

		if (!target) {
			return {
				error: `Tool "${parsed.tool_name}" not found. Use tool_search to find available tools.`,
			};
		}

		try {
			return await target.execute(parsed.parameters as JsonObject, executeOptions);
		} catch (error) {
			// Return API errors to the LLM so it can adjust parameters and retry
			if (error instanceof StackOneAPIError) {
				return {
					error: error.message,
					status_code: error.statusCode,
					tool_name: parsed.tool_name,
				};
			}
			throw error;
		}
	};

	return tool;
}
