import { OAS_DIR } from '../constants';
import { loadSpecs } from '../openapi/loader';
import { StackOneTool, type ToolDefinition, type Tools } from '../tools';
import type { ParameterTransformer } from '../types';
import { extractFileInfo, isValidFilePath, readFileAsBase64 } from '../utils/file';
import { removeJsonSchemaProperty } from '../utils/schema';
import { type BaseToolSetConfig, ToolSet, ToolSetError } from './base';

/**
 * Configuration for StackOne toolset
 */
export interface StackOneToolSetConfig extends BaseToolSetConfig {
  apiKey?: string;
  accountId?: string;
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

          const { fileName } = extractFileInfo(filePath);
          return fileName;
        },
      },
    });

    return transformers;
  }

  /**
   * Initialize StackOne toolset with API key and optional account ID
   * @param config Configuration object containing API key and optional account ID
   */
  constructor(config?: StackOneToolSetConfig) {
    // Initialize base class
    super({
      baseUrl: config?.baseUrl,
      authentication: config?.authentication,
      headers: config?.headers,
      transformers: config?.transformers,
    });

    // Set API key
    this.apiKey = config?.apiKey || process.env.STACKONE_API_KEY || '';
    if (!this.apiKey) {
      console.warn(
        'No API key provided. Set STACKONE_API_KEY environment variable or pass apiKey in config.'
      );
    }

    // Set account ID
    this.accountId = config?.accountId || process.env.STACKONE_ACCOUNT_ID;

    // Set default headers
    this.headers = {
      ...this.headers,
      'x-api-key': this.apiKey,
    };

    // Add default parameter transformers
    const defaultTransformers = StackOneToolSet.getDefaultParameterTransformers();
    for (const [sourceParam, config] of defaultTransformers.entries()) {
      this.addParameterTransformer(sourceParam, config);
    }

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
   * Load tools from the OAS directory
   */
  private loadTools(): void {
    // Load specs from the OAS directory
    const specs = loadSpecs(OAS_DIR);

    // Process each vertical
    for (const [_, tools] of Object.entries(specs)) {
      // Process each tool
      for (const [toolName, toolDef] of Object.entries(tools)) {
        // Process derived values
        const processedDef = this.processDerivedValues(toolDef);

        // Remove account ID parameter if not provided
        if (!this.accountId) {
          this.removeAccountIdParameter(processedDef);
        }

        // Create tool
        const tool = new StackOneTool(
          toolName,
          processedDef.description,
          processedDef.parameters,
          processedDef.execute,
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
