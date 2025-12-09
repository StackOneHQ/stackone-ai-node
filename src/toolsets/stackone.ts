import { DEFAULT_BASE_URL } from '../consts';
import { type StackOneTool, Tools } from '../tool';
import { createFeedbackTool } from '../tools/feedback';
import { type BaseToolSetConfig, ToolSet, ToolSetConfigError } from './base';

/**
 * Configuration for StackOne toolset
 */
export interface StackOneToolSetConfig extends BaseToolSetConfig {
  apiKey?: string;
  accountId?: string;
  strict?: boolean;
}

/**
 * Options for filtering tools when fetching from MCP
 */
export interface FetchToolsOptions {
  /**
   * Filter tools by account IDs
   * Only tools available on these accounts will be returned
   */
  accountIds?: string[];

  /**
   * Filter tools by provider names
   * Only tools from these providers will be returned
   * @example ['hibob', 'bamboohr']
   */
  providers?: string[];

  /**
   * Filter tools by action patterns with glob support
   * Only tools matching these patterns will be returned
   * @example ['*_list_employees', 'hibob_create_employees']
   */
  actions?: string[];
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
 * Class for loading StackOne tools via MCP
 */
export class StackOneToolSet extends ToolSet {
  /**
   * Account ID for StackOne API
   */
  private accountId?: string;
  private accountIds: string[] = [];

  /**
   * Initialise StackOne toolset with API key and optional account ID
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

    // Initialise base class
    super({
      baseUrl: config?.baseUrl ?? process.env.STACKONE_BASE_URL ?? DEFAULT_BASE_URL,
      authentication,
      headers,
    });

    this.accountId = accountId;
  }

  /**
   * Set account IDs for filtering tools
   * @param accountIds Array of account IDs to filter tools by
   * @returns This toolset instance for chaining
   */
  setAccounts(accountIds: string[]): this {
    this.accountIds = accountIds;
    return this;
  }

  /**
   * Fetch tools from MCP with optional filtering
   * @param options Optional filtering options for account IDs, providers, and actions
   * @returns Collection of tools matching the filter criteria
   */
  async fetchTools(options?: FetchToolsOptions): Promise<Tools> {
    // Use account IDs from options, or fall back to instance state
    const effectiveAccountIds = options?.accountIds || this.accountIds;

    // Fetch tools (with account filtering if needed)
    let tools: Tools;
    if (effectiveAccountIds.length > 0) {
      const toolsPromises = effectiveAccountIds.map(async (accountId) => {
        const headers = { 'x-account-id': accountId };
        const mergedHeaders = { ...this.headers, ...headers };

        // Create a temporary toolset instance with the account-specific headers
        const tempHeaders = mergedHeaders;
        const originalHeaders = this.headers;
        this.headers = tempHeaders;

        try {
          const tools = await super.fetchTools();
          return tools.toArray();
        } finally {
          // Restore original headers
          this.headers = originalHeaders;
        }
      });

      const toolArrays = await Promise.all(toolsPromises);
      const allTools = toolArrays.flat();
      tools = new Tools(allTools);
    } else {
      // No account filtering - fetch all tools
      tools = await super.fetchTools();
    }

    // Apply provider and action filters
    const filteredTools = this.filterTools(tools, options);

    // Add feedback tool
    const feedbackTool = createFeedbackTool(undefined, this.accountId, this.baseUrl);
    const toolsWithFeedback = new Tools([...filteredTools.toArray(), feedbackTool]);

    return toolsWithFeedback;
  }

  /**
   * Filter tools by providers and actions
   * @param tools Tools collection to filter
   * @param options Filtering options
   * @returns Filtered tools collection
   */
  private filterTools(tools: Tools, options?: FetchToolsOptions): Tools {
    let filteredTools = tools.toArray();

    // Filter by providers if specified
    if (options?.providers && options.providers.length > 0) {
      const providerSet = new Set(options.providers.map((p) => p.toLowerCase()));
      filteredTools = filteredTools.filter((tool) => {
        // Extract provider from tool name (assuming format: provider_action)
        const provider = tool.name.split('_')[0]?.toLowerCase();
        return provider && providerSet.has(provider);
      });
    }

    // Filter by actions if specified (with glob support)
    if (options?.actions && options.actions.length > 0) {
      filteredTools = filteredTools.filter((tool) =>
        options.actions?.some((pattern) => this._matchGlob(tool.name, pattern))
      );
    }

    return new Tools(filteredTools);
  }

  /**
   * Plan a workflow
   * @param config Configuration object containing workflow details
   * @returns Workflow object
   */
  plan(_: WorkflowConfig): Promise<StackOneTool> {
    throw new Error('Not implemented yet');
  }
}
