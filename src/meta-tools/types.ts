/**
 * Type definitions for meta tools
 */

import type { Arrayable } from 'type-fest';
import type { BaseTool } from '../tool';
import type { JsonDict } from '../types';

/**
 * Configuration for tool search
 */
export interface ToolSearchConfig {
  /**
   * Query string to search for in tool names and descriptions
   */
  query: string;

  /**
   * Maximum number of results to return
   * @default 10
   */
  limit?: number;

  /**
   * Minimum relevance score (0-1) for results
   * @default 0.3
   */
  minScore?: number;

  /**
   * Optional filter patterns to apply after search
   */
  filterPatterns?: Arrayable<string>;

  /**
   * Account ID to use for StackOne tools
   */
  accountId?: string;
}

/**
 * Result of a tool search
 */
export interface ToolSearchResult {
  /**
   * The tool instance
   */
  tool: BaseTool;

  /**
   * Relevance score (0-1)
   */
  score: number;

  /**
   * Reason for match (e.g., "name match", "description match")
   */
  matchReason: string;
}

/**
 * Configuration for a single step in a tool chain
 */
export interface ToolChainStep {
  /**
   * Name of the tool to execute
   */
  toolName: string;

  /**
   * Parameters to pass to the tool
   * Can include references to previous step outputs using {{stepN.path.to.value}} syntax
   */
  parameters: JsonDict;

  /**
   * Optional condition to determine if this step should execute
   * Can reference previous step outputs
   */
  condition?: string;

  /**
   * Optional custom name for this step (defaults to tool name)
   */
  stepName?: string;

  /**
   * Whether to continue execution if this step fails
   * @default false
   */
  continueOnError?: boolean;
}

/**
 * Configuration for tool chain execution
 */
export interface ToolChainConfig {
  /**
   * Array of steps to execute in order
   */
  steps: Arrayable<ToolChainStep>;

  /**
   * Account ID to use for StackOne tools
   */
  accountId?: string;

  /**
   * Whether to stop execution on first error
   * @default true
   */
  stopOnError?: boolean;

  /**
   * Maximum execution time in milliseconds
   * @default 300000 (5 minutes)
   */
  timeout?: number;
}

/**
 * Result of a tool chain execution
 */
export interface ToolChainResult {
  /**
   * Whether all steps executed successfully
   */
  success: boolean;

  /**
   * Results from each step
   */
  stepResults: ToolChainStepResult[];

  /**
   * Total execution time in milliseconds
   */
  executionTime: number;

  /**
   * Error message if execution failed
   */
  error?: string;
}

/**
 * Result from a single step in a tool chain
 */
export interface ToolChainStepResult {
  /**
   * Step index
   */
  stepIndex: number;

  /**
   * Step name
   */
  stepName: string;

  /**
   * Tool name that was executed
   */
  toolName: string;

  /**
   * Whether the step executed successfully
   */
  success: boolean;

  /**
   * Result data from the tool execution
   */
  result?: JsonDict;

  /**
   * Error message if step failed
   */
  error?: string;

  /**
   * Whether the step was skipped due to condition
   */
  skipped?: boolean;

  /**
   * Execution time in milliseconds
   */
  executionTime: number;
}
