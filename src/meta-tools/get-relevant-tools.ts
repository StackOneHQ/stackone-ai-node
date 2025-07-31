/**
 * GetRelevantTools - A meta tool for discovering relevant tools based on user intent
 * @beta This is a beta feature and may change in future versions
 */

import { create, insert, search } from '@orama/orama';
import type { Arrayable } from 'type-fest';
import { BaseTool } from '../tool';
import type { ExecuteConfig, JsonDict, ToolParameters } from '../types';
import { toArray } from '../utils/array';
import { StackOneError } from '../utils/errors';
import { BETA_WARNING } from './consts';
import type { ToolSearchConfig, ToolSearchResult } from './types';

/**
 * A meta tool that searches for relevant tools based on a query
 * @beta
 */
export class GetRelevantTools extends BaseTool {
  private availableTools: BaseTool[];
  private oramaDb: unknown;
  private dbInitialized = false;

  constructor(tools: BaseTool[]) {
    const parameters: ToolParameters = {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Natural language query describing what tools you need',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of tools to return (default: 10)',
          default: 10,
        },
        minScore: {
          type: 'number',
          description: 'Minimum relevance score (0-1) for results (default: 0.3)',
          default: 0.3,
        },
        filterPatterns: {
          oneOf: [
            { type: 'string' },
            {
              type: 'array',
              items: { type: 'string' },
            },
          ],
          description: 'Optional glob patterns to filter results (e.g., "hris_*", "!*_delete_*")',
        },
        accountId: {
          type: 'string',
          description: 'Account ID to use for StackOne tools',
        },
      },
      required: ['query'],
    };

    const executeConfig: ExecuteConfig = {
      method: 'LOCAL',
      url: 'local://get-relevant-tools',
      bodyType: 'json',
      params: [],
    };

    super(
      'get_relevant_tools',
      `Search for relevant tools based on natural language query. ${BETA_WARNING}`,
      parameters,
      executeConfig
    );

    this.availableTools = tools;
  }

  /**
   * Initialize Orama database with tools
   */
  private async initializeOramaDb(): Promise<void> {
    if (this.dbInitialized) return;

    // Create Orama database schema with BM25 scoring
    this.oramaDb = create({
      schema: {
        name: 'string' as const,
        description: 'string' as const,
        category: 'string' as const,
        tags: 'string[]' as const,
      },
      components: {
        tokenizer: {
          stemming: true,
        },
      },
    });

    // Index all tools
    for (const tool of this.availableTools) {
      // Extract category from tool name (e.g., 'hris_create_employee' -> 'hris')
      const parts = tool.name.split('_');
      const category = parts[0];

      // Extract action type
      const actionTypes = ['create', 'update', 'delete', 'get', 'list', 'search'];
      const actions = parts.filter((p) => actionTypes.includes(p));

      if (!this.oramaDb) throw new Error('Orama DB not initialized');
      await insert(this.oramaDb as Parameters<typeof insert>[0], {
        name: tool.name,
        description: tool.description,
        category: category,
        tags: [...parts, ...actions],
      });
    }

    this.dbInitialized = true;
  }

  /**
   * Execute the tool search
   */
  async execute(inputParams?: JsonDict | string): Promise<JsonDict> {
    try {
      const params = typeof inputParams === 'string' ? JSON.parse(inputParams) : inputParams || {};
      const config = params as ToolSearchConfig;

      if (!config.query) {
        throw new StackOneError('Query parameter is required');
      }

      // Initialize Orama DB if needed
      await this.initializeOramaDb();

      // Perform the search
      const results = await this.searchTools(config);

      // Format results for output
      const formattedResults = results.map((result) => ({
        name: result.tool.name,
        description: result.tool.description,
        score: result.score,
        matchReason: result.matchReason,
        parameters: result.tool.parameters,
      }));

      return {
        success: true,
        query: config.query,
        resultsCount: formattedResults.length,
        tools: formattedResults,
        beta: true,
        warning: BETA_WARNING,
      };
    } catch (error) {
      if (error instanceof StackOneError) {
        throw error;
      }
      throw new StackOneError(
        `Error searching for tools: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Search for tools based on the configuration
   */
  private async searchTools(config: ToolSearchConfig): Promise<ToolSearchResult[]> {
    const { query, limit = 10, minScore = 0.3, filterPatterns } = config;

    // Perform semantic search using Orama
    if (!this.oramaDb) throw new Error('Orama DB not initialized');
    const searchResults = await search(this.oramaDb as Parameters<typeof search>[0], {
      term: query,
      limit: limit * 2, // Get more results to filter later
      properties: ['name', 'description', 'tags'],
      boost: {
        name: 2, // Prioritize name matches
        tags: 1.5, // Tags are also important
        description: 1, // Description is baseline
      },
    });

    // Convert Orama results to our format
    const scoredTools: ToolSearchResult[] = [];

    for (const hit of searchResults.hits) {
      const toolName = hit.document.name as string;
      const tool = this.availableTools.find((t) => t.name === toolName);

      if (!tool) continue;

      // Apply filter patterns if provided
      if (filterPatterns && !this.matchesFilter(tool.name, filterPatterns)) {
        continue;
      }

      // Normalize Orama score (typically 0-20+) to 0-1 range
      const oramaScore = hit.score || 0;
      let normalizedScore: number;
      let matchReason: string;

      // Determine match quality based on score ranges
      if (oramaScore >= 15) {
        normalizedScore = 0.95 + Math.min(oramaScore - 15, 5) * 0.01; // 0.95-1.0
        matchReason = 'excellent match';
      } else if (oramaScore >= 10) {
        normalizedScore = 0.8 + ((oramaScore - 10) / 5) * 0.15; // 0.8-0.95
        matchReason = 'strong match';
      } else if (oramaScore >= 5) {
        normalizedScore = 0.6 + ((oramaScore - 5) / 5) * 0.2; // 0.6-0.8
        matchReason = 'good match';
      } else if (oramaScore >= 2) {
        normalizedScore = 0.4 + ((oramaScore - 2) / 3) * 0.2; // 0.4-0.6
        matchReason = 'partial match';
      } else {
        normalizedScore = Math.max(0.1, oramaScore * 0.2); // 0.1-0.4
        matchReason = 'weak match';
      }

      // Check for exact matches and boost score
      if (tool.name.toLowerCase() === query.toLowerCase()) {
        normalizedScore = 1.0;
        matchReason = 'exact name match';
      } else if (tool.name.toLowerCase().includes(query.toLowerCase())) {
        normalizedScore = Math.max(normalizedScore, 0.85);
        matchReason = matchReason === 'exact name match' ? matchReason : 'name contains query';
      }

      if (normalizedScore >= minScore) {
        scoredTools.push({
          tool,
          score: normalizedScore,
          matchReason,
        });
      }
    }

    // Sort by score (descending) and limit results
    scoredTools.sort((a, b) => b.score - a.score);
    return scoredTools.slice(0, limit);
  }

  /**
   * Check if a tool name matches filter patterns
   */
  private matchesFilter(toolName: string, filterPattern: Arrayable<string>): boolean {
    const patterns = toArray(filterPattern);

    // Split into positive and negative patterns
    const positivePatterns = patterns.filter((p) => !p.startsWith('!'));
    const negativePatterns = patterns.filter((p) => p.startsWith('!')).map((p) => p.substring(1));

    // If no positive patterns, treat as match all
    const matchesPositive =
      positivePatterns.length === 0 || positivePatterns.some((p) => this.matchGlob(toolName, p));

    // If any negative pattern matches, exclude the tool
    const matchesNegative = negativePatterns.some((p) => this.matchGlob(toolName, p));

    return matchesPositive && !matchesNegative;
  }

  /**
   * Simple glob pattern matching
   */
  private matchGlob(str: string, pattern: string): boolean {
    const regexPattern = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*').replace(/\?/g, '.');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(str);
  }
}
