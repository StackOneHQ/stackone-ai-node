import { ToolSetLoadError } from '../toolsets/base';
import type { ToolDefinition } from '../types';
import { readJsonFile } from '../utils/file';
import { OpenAPIParser } from './parser';

// Import all specs from the generated index file
import * as specs from '../openapi/generated';

// Import the OpenAPIDocument type
import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
type OpenAPIDocument = OpenAPIV3.Document | OpenAPIV3_1.Document;

/**
 * Load all OpenAPI specs from the oas directory
 * @param baseUrl Optional base URL to use for all operations
 * @param removedParams Optional array of parameter names to remove from all tools
 * @returns Dict mapping vertical names to their tool definitions
 */
export const loadStackOneSpecs = (
  baseUrl?: string,
  removedParams: string[] = []
): Record<string, Record<string, ToolDefinition>> => {
  const tools: Record<string, Record<string, ToolDefinition>> = {};

  // Process each spec from the imported specs object
  for (const [key, value] of Object.entries(specs)) {
    // The key will be in the format 'verticalSpec', we need to extract 'vertical'
    const vertical = key.replace('Spec', '');
    const spec = value as unknown as OpenAPIDocument;
    const parser = new OpenAPIParser(spec, baseUrl, removedParams);
    tools[vertical] = parser.parseTools();
  }

  return tools;
};

/**
 * Functions for loading OpenAPI specs from various sources
 */
export namespace OpenAPILoader {
  /**
   * Load OpenAPI spec from a file
   * @param filePath Path to the OpenAPI spec file
   * @param baseUrl Optional base URL to use for all operations
   * @param removedParams Optional array of parameter names to remove from all tools
   * @returns Tool definitions parsed from the spec
   * @throws ToolSetLoadError If there is an error loading the spec
   */
  export const loadFromFile = (
    filePath: string,
    baseUrl?: string,
    removedParams: string[] = []
  ): Record<string, ToolDefinition> => {
    try {
      const spec = readJsonFile<OpenAPIDocument>(filePath);
      const parser = new OpenAPIParser(spec, baseUrl, removedParams);

      return parser.parseTools();
    } catch (error) {
      if (error instanceof ToolSetLoadError) {
        throw error;
      }
      throw new ToolSetLoadError(
        `Error loading spec from file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  /**
   * Load OpenAPI spec from a URL
   * @param url URL of the OpenAPI spec
   * @param baseUrl Optional base URL to use for all operations
   * @param removedParams Optional array of parameter names to remove from all tools
   * @returns Promise resolving to tool definitions parsed from the spec
   * @throws ToolSetLoadError If there is an error loading the spec
   */
  export const loadFromUrl = async (
    url: string,
    baseUrl?: string,
    removedParams: string[] = []
  ): Promise<Record<string, ToolDefinition>> => {
    try {
      // Fetch the spec from the URL using native fetch
      const response = await fetch(url);
      if (!response.ok) {
        throw new ToolSetLoadError(
          `Failed to fetch OpenAPI spec from URL: ${url}, status: ${response.status}`
        );
      }

      // Parse the spec
      const specContent = await response.text();
      const spec = JSON.parse(specContent) as OpenAPIDocument;
      const parser = new OpenAPIParser(spec, baseUrl, removedParams);

      return parser.parseTools();
    } catch (error) {
      if (error instanceof ToolSetLoadError) {
        throw error;
      }
      throw new ToolSetLoadError(
        `Error loading spec from URL: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };
}
