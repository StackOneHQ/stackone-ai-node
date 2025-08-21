/**
 * Strategy using the current Orama BM25 implementation (meta-tools)
 */
import { StackOneToolSet } from '../../src';
import type { ToolSelectionStrategy, ToolSelectionResult } from './base-strategy';

export class OramaBM25Strategy implements ToolSelectionStrategy {
  name = 'orama-bm25';
  description = 'Current meta-tools implementation using Orama BM25 algorithm';
  
  private toolset: StackOneToolSet;
  private metaTools: any;
  private searchTool: any;
  
  constructor() {
    this.toolset = new StackOneToolSet({ strict: false });
  }
  
  async initialize(): Promise<void> {
    if (!this.searchTool) {
      const allTools = this.toolset.getStackOneTools('*');
      this.metaTools = await allTools.metaTools();
      this.searchTool = this.metaTools.getTool('meta_search_tools');
      
      if (!this.searchTool) {
        throw new Error('meta_search_tools not found');
      }
    }
  }
  
  async select(
    query: string, 
    availableTools?: string[], 
    limit: number = 10
  ): Promise<ToolSelectionResult[]> {
    await this.initialize();
    
    try {
      const searchResult = await this.searchTool.execute({
        query,
        limit,
        minScore: 0.0,
      });
      
      const tools = searchResult.tools as Array<{
        name: string;
        description: string;
        score: number;
      }>;
      
      // Filter by available tools if specified
      const filteredTools = availableTools 
        ? tools.filter(tool => availableTools.includes(tool.name))
        : tools;
      
      return filteredTools.map(tool => ({
        name: tool.name,
        description: tool.description,
        score: tool.score,
      }));
    } catch (error) {
      console.error('OramaBM25Strategy selection error:', error);
      return [];
    }
  }
  
  async cleanup(): Promise<void> {
    // No cleanup needed for Orama strategy
  }
}