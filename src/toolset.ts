import { OAS_DIR } from './constants';
import { OpenAPILoader } from './openapi/loader';
import { ParameterLocation, StackOneTool, Tool, type ToolDefinition, Tools } from './tools';
import type { JsonDict, ParameterTransformer, ParameterTransformerMap } from './types';
import { extractFileInfo, isValidFilePath, readFileAsBase64 } from './utils/file';
import { removeJsonSchemaProperty } from './utils/schema';

/**
 * Base exception for toolset errors
 */
export class ToolSetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ToolSetError';
  }
}

/**
 * Raised when there is an error in the toolset configuration
 */
export class ToolSetConfigError extends ToolSetError {
  constructor(message: string) {
    super(message);
    this.name = 'ToolSetConfigError';
  }
}

/**
 * Raised when there is an error loading tools
 */
export class ToolSetLoadError extends ToolSetError {
  constructor(message: string) {
    super(message);
    this.name = 'ToolSetLoadError';
  }
}

/**
 * Authentication configuration for toolsets
 */
export interface AuthenticationConfig {
  type: 'basic' | 'bearer';
  credentials?: {
    username?: string;
    password?: string;
    token?: string;
  };
  headers?: Record<string, string>;
}

/**
 * Base configuration for all toolsets
 */
export interface BaseToolSetConfig {
  baseUrl?: string;
  authentication?: AuthenticationConfig;
  headers?: Record<string, string>;
  transformers?: ParameterTransformerMap;
  _oasUrl?: string;
}

/**
 * Configuration for StackOne toolset
 */
export interface StackOneToolSetConfig extends BaseToolSetConfig {
  apiKey?: string;
  accountId?: string;
}

/**
 * Configuration for OpenAPI toolset
 */
export interface OpenAPIToolSetConfigFromFilePath extends BaseToolSetConfig {
  /**
   * Path to the OpenAPI spec file
   */
  filePath: string;
}

/**
 * Configuration for OpenAPI toolset from URL
 */
export interface OpenAPIToolSetConfigFromUrl extends BaseToolSetConfig {
  /**
   * URL to the OpenAPI spec
   */
  url: string;
}

/**
 * Base class for all toolsets
 */
export abstract class ToolSet {
  protected baseUrl?: string;
  protected authentication?: AuthenticationConfig;
  protected headers: Record<string, string>;
  protected tools: Tool[] = [];
  protected transformers: ParameterTransformerMap;

  /**
   * Initialize a toolset with optional configuration
   * @param config Optional configuration object
   */
  constructor(config?: BaseToolSetConfig) {
    this.baseUrl = config?.baseUrl;
    this.authentication = config?.authentication;
    this.headers = config?.headers || {};
    this.transformers = config?.transformers || new Map<string, ParameterTransformer>();
  }

  /**
   * Add a derivation configuration
   * @param sourceParam The source parameter name
   * @param config The derivation configuration
   */
  public addParameterTransformer(sourceParam: string, config: ParameterTransformer): void {
    this.transformers.set(sourceParam, config);
  }

  /**
   * Check if a tool name matches the filter pattern
   * @param toolName Name of the tool to check
   * @param filterPattern String or array of glob patterns to match against.
   *                     Patterns starting with ! are treated as negative matches.
   * @returns True if the tool name matches any positive pattern and no negative patterns,
   *          False otherwise
   */
  protected _matchesFilter(toolName: string, filterPattern: string | string[]): boolean {
    const patterns = Array.isArray(filterPattern) ? filterPattern : [filterPattern];

    // Split into positive and negative patterns
    const positivePatterns = patterns.filter((p) => !p.startsWith('!'));
    const negativePatterns = patterns.filter((p) => p.startsWith('!')).map((p) => p.substring(1));

    // If no positive patterns, treat as match all
    const matchesPositive =
      positivePatterns.length === 0 || positivePatterns.some((p) => this._matchGlob(toolName, p));

    // If any negative pattern matches, exclude the tool
    const matchesNegative = negativePatterns.some((p) => this._matchGlob(toolName, p));

    return matchesPositive && !matchesNegative;
  }

  /**
   * Match a string against a glob pattern
   * @param str String to match
   * @param pattern Glob pattern to match against
   * @returns True if the string matches the pattern, false otherwise
   */
  protected _matchGlob(str: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regexPattern = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*').replace(/\?/g, '.');

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(str);
  }

  /**
   * Get tools matching the specified filter pattern
   * @param filterPattern Optional glob pattern or array of patterns to filter tools
   *                     (e.g. "hris_*", ["crm_*", "ats_*"])
   * @param options Optional account ID or headers to apply to the tools
   * @returns Collection of tools matching the filter pattern
   */
  getTools(filterPattern?: string | string[], headers?: Record<string, string>): Tools {
    if (!filterPattern) {
      console.warn(
        'No filter pattern provided. Loading all tools may exceed context windows in ' +
          'AI applications.'
      );
    }

    // Create merged headers from instance headers and provided headers
    const mergedHeaders = { ...this.headers, ...headers };

    // Filter tools based on pattern
    const filteredTools = this.tools.filter((tool) => {
      // If headers are provided, apply them to the tool
      if (mergedHeaders && tool.setHeaders) {
        tool.setHeaders(mergedHeaders);
      }

      return !filterPattern || this._matchesFilter(tool.name, filterPattern);
    });

    // Create a new Tools instance with the filtered tools
    return new Tools(filteredTools);
  }

  /**
   * Process transformed parameters in a tool definition
   * @param toolDef Tool definition to process
   * @returns Updated tool definition with transformed parameters
   */
  protected processDerivedValues(toolDef: ToolDefinition): ToolDefinition {
    // If no derivation configs, return the original tool definition
    if (this.transformers.size === 0) {
      return toolDef;
    }

    // Create a copy of the tool definition
    const processedDef = { ...toolDef };
    const properties = processedDef.parameters.properties;

    // Process each parameter in the execute config
    for (const param of processedDef.execute.params) {
      // Skip parameters that are already derived
      if (param.derivedFrom) continue;

      // Check if this parameter is a source for any derivation config
      if (this.transformers.has(param.name)) {
        const config = this.transformers.get(param.name);

        // Only proceed if config exists
        if (config) {
          // Add transformed parameters to the tool definition
          for (const targetParam of Object.keys(config.transforms)) {
            // Skip if the parameter already exists in execute params
            if (processedDef.execute.params.some((p) => p.name === targetParam)) continue;

            // Add the transformed parameter to execute params
            processedDef.execute.params.push({
              name: targetParam,
              type: 'string',
              location: this.determineParameterLocation(targetParam),
              derivedFrom: param.name,
            });

            // Add the transformed parameter to schema properties if not already there
            if (!properties[targetParam]) {
              properties[targetParam] = {
                type: 'string',
                description: `Derived from ${param.name}`,
              };
            }
          }
        }
      }
    }

    return processedDef;
  }

  /**
   * Determine the parameter location for a source parameter
   * @param paramName The name of the parameter
   * @returns The parameter location
   */
  protected determineParameterLocation(paramName: string): ParameterLocation {
    // Check if the parameter exists in any of the tools
    for (const tool of this.tools) {
      // Check if the parameter exists in the execute config
      const param = tool._executeConfig.params.find((p) => p.name === paramName);
      if (param) {
        return param.location;
      }
    }

    // Default to BODY if not found
    return ParameterLocation.BODY;
  }
}

/**
 * Class for loading StackOne tools from the OAS directory
 */
export class StackOneToolSet extends ToolSet {
  /**
   * API key for StackOne API
   */
  private apiKey: string;

  /**
   * Account ID for StackOne API
   */
  private accountId?: string;

  /**
   * Get the default derivation configurations for StackOne tools
   */
  private static getDefaultParameterTransformers(): Map<string, ParameterTransformer> {
    const transformers = new Map<string, ParameterTransformer>();

    // File path derivation config
    transformers.set('file_path', {
      transforms: {
        content: (filePath: unknown): string => {
          if (typeof filePath !== 'string') {
            throw new ToolSetError('file_path must be a string');
          }

          if (!isValidFilePath(filePath)) {
            throw new ToolSetError(`Invalid file path or file not found: ${filePath}`);
          }

          return readFileAsBase64(filePath);
        },
        name: (filePath: unknown): string => {
          if (typeof filePath !== 'string') {
            throw new ToolSetError('file_path must be a string');
          }

          if (!isValidFilePath(filePath)) {
            throw new ToolSetError(`Invalid file path or file not found: ${filePath}`);
          }

          const { fileName } = extractFileInfo(filePath);
          return fileName;
        },
        file_format: (filePath: unknown): JsonDict | null => {
          if (typeof filePath !== 'string') {
            throw new ToolSetError('file_path must be a string');
          }

          const { extension } = extractFileInfo(filePath);
          return extension ? { value: extension } : null;
        },
      },
    });

    return transformers;
  }

  /**
   * Initialize StackOne tools with authentication
   * @param config Optional configuration object
   * @throws ToolSetConfigError If API key is not provided
   */
  constructor(config?: StackOneToolSetConfig) {
    // Get default derivation configs
    const defaultParameterTransformers = StackOneToolSet.getDefaultParameterTransformers();

    // Create a new map with the default configs
    const transformers = new Map(defaultParameterTransformers);

    // Add user-provided configs, overriding defaults if needed
    if (config?.transformers) {
      for (const [key, value] of config.transformers.entries()) {
        transformers.set(key, value);
      }
    }

    // Initialize base class with config and derivation configs
    super({
      ...config,
      transformers: transformers,
    });

    // Get API key from config or environment variable
    this.apiKey = config?.apiKey || process.env.STACKONE_API_KEY || '';

    // Get account ID from config
    this.accountId = config?.accountId;

    // Set API key in headers
    if (this.apiKey) {
      this.headers['x-api-key'] = this.apiKey;
    } else {
      throw new ToolSetConfigError(
        'API key is required. Provide it in the constructor or set the STACKONE_API_KEY environment variable.'
      );
    }

    // Set account ID in headers if provided
    if (this.accountId) {
      this.headers['x-account-id'] = this.accountId;
    }

    // Load tools in constructor
    this.loadTools();
  }

  /**
   * Get tools matching the specified filter pattern
   * @param filterPattern Optional glob pattern or array of patterns to filter tools
   *                     (e.g. "hris_*", ["crm_*", "ats_*"])
   * @param accountId Optional account ID override. If not provided, uses the one from initialization
   * @returns Collection of tools matching the filter pattern
   */
  getStackOneTools(filterPattern?: string | string[], accountId?: string): Tools {
    // Create headers object with account ID if provided
    const headers: Record<string, string> = accountId ? { 'x-account-id': accountId } : {};

    // Call the base class method with the headers
    return super.getTools(filterPattern, headers);
  }

  /**
   * Load tools from the OAS directory
   * @throws ToolSetLoadError If there is an error loading the tools
   */
  private loadTools(): void {
    try {
      // Load tools using the OpenAPILoader
      const toolDefinitions = OpenAPILoader.loadFromDirectory(OAS_DIR, this.baseUrl);

      // Create tools from the definitions
      for (const vertical of Object.keys(toolDefinitions)) {
        for (const [toolName, toolDef] of Object.entries(toolDefinitions[vertical])) {
          // Process file upload parameters
          const processedToolDef = this.processDerivedValues(toolDef);

          // Remove x-account-id parameter if it's already set in headers
          if (this.headers['x-account-id']) {
            this.removeAccountIdParameter(processedToolDef);
          }

          const tool = new StackOneTool(
            toolName,
            processedToolDef.description,
            processedToolDef.parameters,
            processedToolDef.execute,
            this.authentication,
            this.headers
          );
          this.tools.push(tool);
        }
      }
    } catch (error) {
      if (error instanceof ToolSetError) {
        throw error;
      }
      throw new ToolSetLoadError(
        `Error loading tools: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Remove x-account-id parameter from tool definition
   * @param toolDef The tool definition to modify
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

    // Remove from execute params
    if (toolDef.execute.params) {
      toolDef.execute.params = toolDef.execute.params.filter(
        (param) => param.name !== 'x-account-id'
      );
    }
  }
}

/**
 * Class for parsing OpenAPI specs from a file path or URL
 */
export class OpenAPIToolSet extends ToolSet {
  /**
   * Initialize OpenAPI toolset with spec source and optional authentication
   * @param config Configuration object containing filePath and optional authentication
   * @throws ToolSetConfigError If neither filePath nor url is provided
   * @throws ToolSetLoadError If there is an error loading the tools from the file
   */
  constructor(config: OpenAPIToolSetConfigFromFilePath | Omit<BaseToolSetConfig, '_oasUrl'>) {
    // Initialize base class
    super({
      baseUrl: config?.baseUrl,
      authentication: config?.authentication,
      headers: config?.headers,
      transformers: config?.transformers,
    });

    if ('filePath' in config) {
      this.loadToolsFromFile(config.filePath);
    } else if ('url' in config) {
      throw new ToolSetConfigError('url must be provided in the OpenAPIToolSet.fromUrl() method.');
    } else if (!('_oasUrl' in config) && !('filePath' in config)) {
      throw new ToolSetConfigError('Either filePath or url must be provided');
    }
  }

  /**
   * Create an OpenAPIToolSet instance from a URL
   * @param config Configuration object containing url and optional authentication
   * @returns Promise resolving to a new OpenAPIToolSet instance
   * @throws ToolSetConfigError If URL is not provided
   * @throws ToolSetLoadError If there is an error loading the tools from the URL
   */
  public static async fromUrl(config: OpenAPIToolSetConfigFromUrl): Promise<OpenAPIToolSet> {
    if (!config.url) {
      throw new ToolSetConfigError('URL must be provided');
    }

    const toolset = new OpenAPIToolSet({
      baseUrl: config.baseUrl,
      authentication: config.authentication,
      headers: config.headers,
      transformers: config.transformers,
      _oasUrl: config.url,
    });

    await toolset.loadToolsFromUrl(config.url);
    return toolset;
  }

  /**
   * Load tools from a file path
   * @param filePath Path to the OpenAPI spec file
   * @throws ToolSetLoadError If there is an error loading the tools
   */
  private loadToolsFromFile(filePath: string): void {
    try {
      // Load tools using the OpenAPILoader
      const toolDefinitions = OpenAPILoader.loadFromFile(filePath, this.baseUrl);

      // Create tools from the definitions
      for (const [toolName, toolDef] of Object.entries(toolDefinitions)) {
        const tool = this.createTool(toolName, toolDef);
        this.tools.push(tool);
      }
    } catch (error) {
      if (error instanceof ToolSetError) {
        throw error;
      }
      throw new ToolSetLoadError(
        `Error loading tools from file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Load tools from a URL
   * @param url URL of the OpenAPI spec
   * @throws ToolSetLoadError If there is an error loading the tools
   */
  private async loadToolsFromUrl(url: string): Promise<void> {
    try {
      // Load tools using the OpenAPILoader
      const toolDefinitions = await OpenAPILoader.loadFromUrl(url, this.baseUrl);

      // Create tools from the definitions
      for (const [toolName, toolDef] of Object.entries(toolDefinitions)) {
        const tool = this.createTool(toolName, toolDef);
        this.tools.push(tool);
      }
    } catch (error) {
      if (error instanceof ToolSetError) {
        throw error;
      }
      throw new ToolSetLoadError(
        `Error loading tools from URL: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Create a tool with the appropriate authentication
   * @param toolName Name of the tool
   * @param toolDef Tool definition
   * @returns A new Tool instance
   */
  private createTool(toolName: string, toolDef: ToolDefinition): Tool {
    // Process file upload parameters if derivation configs are provided
    const processedToolDef = this.transformers.size ? this.processDerivedValues(toolDef) : toolDef;

    // Create a new Tool instance with the derivation configs
    return new Tool(
      toolName,
      processedToolDef.description,
      processedToolDef.parameters,
      processedToolDef.execute,
      this.authentication,
      this.headers,
      this.transformers
    );
  }
}
