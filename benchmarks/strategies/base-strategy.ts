/**
 * Base interface for tool selection strategies
 */

export interface ToolSelectionResult {
  name: string;
  description: string;
  score: number;
}

export interface ToolSelectionStrategy {
  name: string;
  description: string;
  
  /**
   * Select tools based on a user query
   * @param query Natural language query
   * @param availableTools List of available tool names (optional)
   * @param limit Maximum number of results to return
   * @returns Array of tool selection results ranked by relevance
   */
  select(
    query: string, 
    availableTools?: string[], 
    limit?: number
  ): Promise<ToolSelectionResult[]>;
  
  /**
   * Clean up any resources
   */
  cleanup?(): Promise<void>;
}

export interface ExtractedFunction {
  name: string;
  category: string;
  action: string;
  entity: string;
  description: string;
  summary?: string;
  method: string;
  path: string;
  parameters: Array<{
    name: string;
    type: string;
    required: boolean;
    description?: string;
    location: string;
  }>;
  complexity: number;
  tags: string[];
}