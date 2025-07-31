import * as OpenAPILoader from '../openapi/loader';
import { BaseTool } from '../tool';
import type { ToolDefinition } from '../types';
import { type BaseToolSetConfig, ToolSet, ToolSetConfigError, ToolSetLoadError } from './base';

/**
 * Configuration for OpenAPI toolset from file path
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
      _oasUrl: config.url,
    });

    await toolset.loadToolsFromUrl(config.url);

    return toolset;
  }

  /**
   * Load tools from a file
   * @param filePath Path to the OpenAPI spec file
   * @throws ToolSetLoadError If there is an error loading the tools from the file
   */
  private loadToolsFromFile(filePath: string): void {
    try {
      // Load tools from the file
      const tools = OpenAPILoader.loadFromFile(filePath, this.baseUrl);

      // Process each tool
      for (const [toolName, toolDef] of Object.entries(tools)) {
        // Create tool
        const tool = this.createTool(toolName, toolDef);

        // Add tool to the list
        this.tools.push(tool);
      }
    } catch (error) {
      throw new ToolSetLoadError(
        `Error loading tools from file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Load tools from a URL
   * @param url URL of the OpenAPI spec
   * @throws ToolSetLoadError If there is an error loading the tools from the URL
   */
  private async loadToolsFromUrl(url: string): Promise<void> {
    try {
      // Load tools from the URL
      const tools = await OpenAPILoader.loadFromUrl(url, this.baseUrl);

      // Process each tool
      for (const [toolName, toolDef] of Object.entries(tools)) {
        // Create tool
        const tool = this.createTool(toolName, toolDef);

        // Add tool to the list
        this.tools.push(tool);
      }
    } catch (error) {
      throw new ToolSetLoadError(
        `Error loading tools from URL: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Create a tool from a tool definition
   * @param toolName Name of the tool
   * @param toolDef Tool definition
   * @returns Tool instance
   */
  private createTool(toolName: string, toolDef: ToolDefinition): BaseTool {
    // Create tool
    const { description, parameters, execute } = toolDef;
    const tool = new BaseTool(toolName, description, parameters, execute, this.headers);

    return tool;
  }
}
