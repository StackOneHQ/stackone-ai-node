import * as orama from '@orama/orama';
import { ExecuteToolChain, GetRelevantTools } from '../meta-tools';
import { loadStackOneSpecs } from '../openapi/loader';
import { StackOneTool, Tools } from '../tool';
import type { ToolDefinition } from '../types';
import { removeJsonSchemaProperty } from '../utils/schema';
import { type BaseToolSetConfig, ToolSet, ToolSetConfigError } from './base';

/**
 * Configuration for StackOne toolset
 */
export interface StackOneToolSetConfig extends BaseToolSetConfig {
  apiKey?: string;
  accountId?: string;
  strict?: boolean;
  removedParams?: string[]; // List of parameters to remove from all tools
  includeMetaTools?: boolean; // Whether to include meta tools (default: true)
}

/**
 * Configuration for workflow
 */
export interface WorkflowConfig {
  key: string;
  input: string;
  model: string;
  tools: string[];
  accountIds: string[];
  cache?: boolean;
}

/**
 * Class for loading StackOne tools from the OAS directory
 */
export class StackOneToolSet extends ToolSet {
  /**
   * Account ID for StackOne API
   */
  private accountId?: string;
  private readonly _removedParams: string[];
  private readonly includeMetaTools: boolean;
  private metaSearchDb: unknown;
  private metaSearchDbInitialized = false;

  /**
   * Initialize StackOne toolset with API key and optional account ID
   * @param config Configuration object containing API key and optional account ID
   */
  constructor(config?: StackOneToolSetConfig) {
    const apiKey = config?.apiKey || process.env.STACKONE_API_KEY;

    if (!apiKey && config?.strict) {
      throw new ToolSetConfigError(
        'No API key provided. Set STACKONE_API_KEY environment variable or pass apiKey in config.'
      );
    }

    if (!apiKey) {
      console.warn(
        'No API key provided. Set STACKONE_API_KEY environment variable or pass apiKey in config.'
      );
    }

    const authentication = {
      type: 'basic' as const,
      credentials: {
        username: apiKey || '',
        password: '',
      },
    };

    const accountId = config?.accountId || process.env.STACKONE_ACCOUNT_ID;

    const headers = {
      ...config?.headers,
      ...(accountId ? { 'x-account-id': accountId } : {}),
    };

    // Initialize base class
    super({
      baseUrl: config?.baseUrl,
      authentication,
      headers,
    });

    this.accountId = accountId;
    this._removedParams = ['source_value'];
    this.includeMetaTools = config?.includeMetaTools !== false; // Default to true

    // Load tools
    this.loadTools();
  }

  /**
   * Get StackOne tools matching a filter pattern
   * @param filterPattern Optional glob pattern or array of patterns to filter tools
   * @param accountId Optional account ID to use for the tools
   * @returns Collection of tools matching the filter pattern
   */
  getStackOneTools(filterPattern?: string | string[], accountId?: string): Tools {
    // Use provided account ID or fall back to the instance account ID
    const effectiveAccountId = accountId || this.accountId;

    // Create headers with account ID if provided
    const headers: Record<string, string> = effectiveAccountId
      ? { 'x-account-id': effectiveAccountId }
      : {};

    // Get tools with headers
    const tools = this.getTools(filterPattern, headers);

    // If meta tools are included and no specific filter is provided or filter matches meta tools
    if (this.includeMetaTools && this.shouldIncludeMetaTools(filterPattern)) {
      const allTools = tools.toArray();

      // Add meta tools
      const metaTools = [new GetRelevantTools(allTools), new ExecuteToolChain(tools)];

      // Return combined tools
      return new Tools([...allTools, ...metaTools]);
    }

    return tools;
  }

  /**
   * Plan a workflow
   * @param config Configuration object containing workflow details
   * @returns Workflow object
   */
  plan(_: WorkflowConfig): Promise<StackOneTool> {
    throw new Error('Not implemented yet');
  }

  /**
   * Load tools from the OAS directory
   */
  private loadTools(): void {
    const specs = loadStackOneSpecs(this.baseUrl, this._removedParams);

    // Process each vertical
    for (const [_, tools] of Object.entries(specs)) {
      // Process each tool
      for (const [toolName, toolDef] of Object.entries(tools)) {
        // Remove account ID parameter if not provided
        if (!this.accountId) {
          this.removeAccountIdParameter(toolDef);
        }

        // Create tool
        const tool = new StackOneTool(
          toolName,
          toolDef.description,
          toolDef.parameters,
          toolDef.execute,
          this.headers
        );

        // Add tool to the list
        this.tools.push(tool);
      }
    }
  }

  /**
   * Remove account ID parameter from a tool definition
   * @param toolDef Tool definition to modify
   */
  private removeAccountIdParameter(toolDef: ToolDefinition): void {
    // Remove from parameters
    if (toolDef.parameters.properties && 'x-account-id' in toolDef.parameters.properties) {
      removeJsonSchemaProperty(toolDef.parameters.properties, 'x-account-id');
    }

    // Remove from required parameters
    if (toolDef.parameters.required) {
      toolDef.parameters.required = toolDef.parameters.required.filter(
        (param) => param !== 'x-account-id'
      );
    }
  }

  /**
   * Initialize Orama database for meta search
   */
  private async initializeMetaSearchDb(): Promise<void> {
    if (this.metaSearchDbInitialized) return;

    // Create Orama database schema with BM25 scoring
    this.metaSearchDb = orama.create({
      schema: {
        name: 'string' as const,
        description: 'string' as const,
        category: 'string' as const,
        tags: 'string[]' as const,
      },
      components: {
        tokenizer: {
          stemming: true,
        },
      },
    });

    // Index all tools
    for (const tool of this.tools) {
      // Extract category from tool name (e.g., 'hris_create_employee' -> 'hris')
      const parts = tool.name.split('_');
      const category = parts[0];

      // Extract action type
      const actionTypes = ['create', 'update', 'delete', 'get', 'list', 'search'];
      const actions = parts.filter((p) => actionTypes.includes(p));

      if (!this.metaSearchDb) throw new Error('Meta search DB not initialized');
      await orama.insert(this.metaSearchDb as Parameters<typeof orama.insert>[0], {
        name: tool.name,
        description: tool.description,
        category: category,
        tags: [...parts, ...actions],
      });
    }

    this.metaSearchDbInitialized = true;
  }

  /**
   * Meta search for tools using natural language query
   * @param query Natural language query describing desired tools
   * @param options Search options
   * @returns Filtered collection of tools matching the query
   */
  async metaSearchTools(
    query: string,
    options?: {
      limit?: number;
      minScore?: number;
      accountId?: string;
    }
  ): Promise<Tools> {
    // Initialize meta search DB if needed
    await this.initializeMetaSearchDb();

    const limit = options?.limit || 10;
    const minScore = options?.minScore || 0.3;
    const effectiveAccountId = options?.accountId || this.accountId;

    // Perform semantic search using Orama
    if (!this.metaSearchDb) throw new Error('Meta search DB not initialized');
    const searchResults = await orama.search(
      this.metaSearchDb as Parameters<typeof orama.search>[0],
      {
        term: query,
        limit: limit * 2, // Get more results to filter later
        properties: ['name', 'description', 'tags'],
        boost: {
          name: 2, // Prioritize name matches
          tags: 1.5, // Tags are also important
          description: 1, // Description is baseline
        },
      }
    );

    // Collect matching tools
    const matchingTools: StackOneTool[] = [];

    for (const hit of searchResults.hits) {
      const toolName = hit.document.name as string;
      const tool = this.tools.find((t) => t.name === toolName);

      if (!tool || !(tool instanceof StackOneTool)) continue;

      // Normalize Orama score
      const oramaScore = hit.score || 0;
      const normalizedScore = Math.min(1, oramaScore / 20); // Normalize to 0-1

      if (normalizedScore >= minScore) {
        // Clone tool with account ID if provided
        const toolWithAccount = effectiveAccountId
          ? new StackOneTool(tool.name, tool.description, tool.parameters, tool.executeConfig, {
              ...tool.getHeaders(),
              'x-account-id': effectiveAccountId,
            })
          : tool;

        matchingTools.push(toolWithAccount);

        if (matchingTools.length >= limit) break;
      }
    }

    return new Tools(matchingTools);
  }

  /**
   * Check if meta tools should be included based on filter pattern
   * @param filterPattern Filter pattern to check
   * @returns Whether meta tools should be included
   */
  private shouldIncludeMetaTools(filterPattern?: string | string[]): boolean {
    // If no filter, include meta tools
    if (!filterPattern) {
      return true;
    }

    // Check if any pattern would match meta tool names
    const metaToolNames = ['get_relevant_tools', 'execute_tool_chain'];
    const patterns = Array.isArray(filterPattern) ? filterPattern : [filterPattern];

    for (const pattern of patterns) {
      // If pattern starts with !, it's a negative pattern
      if (pattern.startsWith('!')) {
        const negPattern = pattern.substring(1);
        // If any meta tool matches negative pattern, exclude meta tools
        if (metaToolNames.some((name) => this._matchGlob(name, negPattern))) {
          return false;
        }
      } else {
        // If any meta tool matches positive pattern, include meta tools
        if (metaToolNames.some((name) => this._matchGlob(name, pattern))) {
          return true;
        }
      }
    }

    // If only positive patterns and no match, exclude meta tools
    return patterns.every((p) => p.startsWith('!'));
  }
}
