import type { Arrayable } from 'type-fest';
import { type BaseTool, Tools } from '../tool';
import type { Experimental_ToolCreationOptions } from '../types';
import { toArray } from '../utils/array';

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

  /**
   * Initialize a toolset with optional configuration
   * @param config Optional configuration object
   */
  constructor(config?: BaseToolSetConfig) {
    this.baseUrl = config?.baseUrl;
    this.authentication = config?.authentication;
    this.headers = config?.headers || {};

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
   * Check if a tool name matches a filter pattern
   * @param toolName Tool name to check
   * @param filterPattern Filter pattern or array of patterns
   * @returns True if the tool name matches the filter pattern
   */
  protected _matchesFilter(toolName: string, filterPattern: Arrayable<string>): boolean {
    // Convert to array to handle both single string and array patterns
    const patterns = toArray(filterPattern);

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
  getTool(name: string, headers?: Record<string, string>): BaseTool;
  getTool(name: string, options: Experimental_ToolCreationOptions): BaseTool;
  getTool(
    name: string,
    headersOrOptions?: Record<string, string> | Experimental_ToolCreationOptions
  ): BaseTool {
    const tool = this.tools.find((tool) => tool.name === name);
    if (!tool) {
      throw new ToolSetError(`Tool with name ${name} not found`);
    }

    // Determine if the second parameter is headers or experimental options
    const isExperimentalOptions =
      headersOrOptions &&
      ('experimental_schemaOverride' in headersOrOptions ||
        'experimental_preExecute' in headersOrOptions);

    if (isExperimentalOptions) {
      const options = headersOrOptions as Experimental_ToolCreationOptions;

      // Get the tools collection and use its getTool method with experimental options
      const toolsCollection = new Tools([tool]);
      const experimentalTool = toolsCollection.getTool(name, options);

      if (!experimentalTool) {
        throw new ToolSetError(`Tool with name ${name} not found`);
      }

      // Apply instance headers to the tool
      if (this.headers && experimentalTool.setHeaders) {
        experimentalTool.setHeaders(this.headers);
      }

      return experimentalTool;
    }

    // Traditional headers-based approach
    const headers = headersOrOptions as Record<string, string> | undefined;
    const mergedHeaders = { ...this.headers, ...headers };
    if (mergedHeaders && tool.setHeaders) {
      tool.setHeaders(mergedHeaders);
    }
    return tool;
  }
}
