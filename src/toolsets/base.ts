import { type BaseTool, Tools } from '../tool';
import {
  ParameterLocation,
  type ParameterTransformer,
  type ParameterTransformerMap,
  type ToolDefinition,
} from '../types';

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
 * Base class for all toolsets
 */
export abstract class ToolSet {
  protected baseUrl?: string;
  protected authentication?: AuthenticationConfig;
  protected headers: Record<string, string>;
  protected tools: BaseTool[] = [];
  protected transformers: ParameterTransformerMap;

  /**
   * Initialize a toolset with optional configuration
   * @param config Optional configuration object
   */
  constructor(config?: BaseToolSetConfig) {
    this.baseUrl = config?.baseUrl;
    this.authentication = config?.authentication;
    this.headers = config?.headers || {};
    this.transformers = new Map(config?.transformers || []);

    // Set Authentication headers if provided
    if (this.authentication) {
      // Only set auth headers if they don't already exist in custom headers
      const needsAuthHeader = !('Authorization' in this.headers);

      if (needsAuthHeader) {
        switch (this.authentication.type) {
          case 'basic':
            if (this.authentication.credentials?.username) {
              const username = this.authentication.credentials.username;
              const password = this.authentication.credentials.password || '';
              const authString = Buffer.from(`${username}:${password}`).toString('base64');
              this.headers.Authorization = `Basic ${authString}`;
            }
            break;
          case 'bearer':
            if (this.authentication.credentials?.token) {
              this.headers.Authorization = `Bearer ${this.authentication.credentials.token}`;
            }
            break;

          default:
            throw new ToolSetError(`Unsupported authentication type: ${this.authentication.type}`);
        }
      }

      // Add any additional headers from authentication config, but don't override existing ones
      if (this.authentication.headers) {
        this.headers = { ...this.authentication.headers, ...this.headers };
      }
    }
  }

  /**
   * Add a parameter transformer to the toolset
   * @param sourceParam Source parameter name
   * @param config Transformer configuration
   */
  public setParameterTransformer(sourceParam: string, config: ParameterTransformer): void {
    this.transformers.set(sourceParam, config);
  }

  /**
   * Check if a tool name matches a filter pattern
   * @param toolName Tool name to check
   * @param filterPattern Filter pattern or array of patterns
   * @returns True if the tool name matches the filter pattern
   */
  protected _matchesFilter(toolName: string, filterPattern: string | string[]): boolean {
    // If filterPattern is an array, check if any pattern matches
    if (Array.isArray(filterPattern)) {
      // Split into positive and negative patterns
      const positivePatterns = filterPattern.filter((p) => !p.startsWith('!'));
      const negativePatterns = filterPattern
        .filter((p) => p.startsWith('!'))
        .map((p) => p.substring(1));

      // If no positive patterns, treat as match all
      const matchesPositive =
        positivePatterns.length === 0 || positivePatterns.some((p) => this._matchGlob(toolName, p));

      // If any negative pattern matches, exclude the tool
      const matchesNegative = negativePatterns.some((p) => this._matchGlob(toolName, p));

      return matchesPositive && !matchesNegative;
    }

    // Otherwise, check if the single pattern matches
    return this._matchGlob(toolName, filterPattern);
  }

  /**
   * Check if a string matches a glob pattern
   * @param str String to check
   * @param pattern Glob pattern
   * @returns True if the string matches the pattern
   */
  protected _matchGlob(str: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regexPattern = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*').replace(/\?/g, '.');

    // Create regex with start and end anchors
    const regex = new RegExp(`^${regexPattern}$`);

    // Test if the string matches the pattern
    return regex.test(str);
  }

  /**
   * Get tools matching a filter pattern
   * @param filterPattern Optional glob pattern or array of patterns to filter tools
   *                     (e.g. "hris_*", ["crm_*", "ats_*"])
   * @param headers Optional account ID or headers to apply to the tools
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
   * Get a tool by name
   * @param name Tool name
   * @param headers Optional headers to apply to the tool
   * @returns Tool instance
   */
  getTool(name: string, headers?: Record<string, string>): BaseTool {
    const tool = this.tools.find((tool) => tool.name === name);
    if (!tool) {
      throw new ToolSetError(`Tool with name ${name} not found`);
    }

    const mergedHeaders = { ...this.headers, ...headers };
    if (mergedHeaders && tool.setHeaders) {
      tool.setHeaders(mergedHeaders);
    }
    return tool;
  }
  /**
   * Process transformed parameters in a tool definition
   * @param toolDef Tool definition to process
   * @returns Updated tool definition with transformed parameters
   */
  protected processDerivedValues(toolDef: ToolDefinition): ToolDefinition {
    // Create a copy of the tool definition to avoid modifying the original
    const processedDef = { ...toolDef };

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
              location: this.determineParameterLocation(targetParam),
              type: param.type,
              derivedFrom: param.name,
            });
          }
        }
      }
    }

    return processedDef;
  }

  /**
   * Determine the location of a parameter
   * @param paramName Parameter name
   * @returns Parameter location (HEADER, QUERY, PATH, or BODY)
   */
  protected determineParameterLocation(paramName: string): ParameterLocation {
    // Check if the parameter exists in any of the tools
    for (const tool of this.tools) {
      // Check if the parameter exists in the execute config
      const param = tool.executeConfig.params.find((p) => p.name === paramName);
      if (param) {
        return param.location;
      }
    }

    // Default to BODY if not found
    return ParameterLocation.BODY;
  }
}
