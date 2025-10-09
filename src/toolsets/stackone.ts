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
  private accountIds: string[] = [];
  private readonly _removedParams: string[];

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
    return this.getTools(filterPattern, headers);
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
   * Fetch tools from MCP with optional account ID filtering
   * @param options Optional filtering options for account IDs
   * @returns Collection of tools matching the filter criteria
   *
   * TODO: Add support for filtering by providers and actions
   * - providers: Filter tools by provider names (e.g., ['hibob', 'bamboohr'])
   * - actions: Filter tools by action patterns with glob support (e.g., ['*_list_employees'])
   */
  async fetchTools(options?: FetchToolsOptions): Promise<Tools> {
    // Use account IDs from options, or fall back to instance state
    const effectiveAccountIds = options?.accountIds || this.accountIds;

    // If account IDs are specified, fetch tools for each account and merge
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

      return new Tools(allTools);
    }

    // No account filtering - fetch all tools
    return await super.fetchTools();
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
}
