/**
 * ExecuteToolChain - A meta tool for orchestrating multiple tool executions
 * @beta This is a beta feature and may change in future versions
 */

import { BaseTool, StackOneTool, type Tools } from '../tool';
import type { ExecuteConfig, JsonDict, ToolParameters } from '../types';
import { toArray } from '../utils/array';
import { StackOneError } from '../utils/errors';
import { BETA_WARNING } from './consts';
import type { ToolChainConfig, ToolChainResult, ToolChainStep, ToolChainStepResult } from './types';

/**
 * A meta tool that executes multiple tools in sequence with parameter passing
 * @beta
 */
export class ExecuteToolChain extends BaseTool {
  private tools: Tools;

  constructor(tools: Tools) {
    const parameters: ToolParameters = {
      type: 'object',
      properties: {
        steps: {
          type: 'array',
          description: 'Array of tool execution steps',
          items: {
            type: 'object',
            properties: {
              toolName: {
                type: 'string',
                description: 'Name of the tool to execute',
              },
              parameters: {
                type: 'object',
                description:
                  'Parameters for the tool. Use {{stepN.path.to.value}} to reference previous results',
              },
              condition: {
                type: 'string',
                description: 'Optional condition expression (e.g., "{{step1.success}} === true")',
              },
              stepName: {
                type: 'string',
                description: 'Optional custom name for this step',
              },
              continueOnError: {
                type: 'boolean',
                description: 'Whether to continue if this step fails',
                default: false,
              },
            },
            required: ['toolName', 'parameters'],
          },
        },
        accountId: {
          type: 'string',
          description: 'Account ID to use for StackOne tools',
        },
        stopOnError: {
          type: 'boolean',
          description: 'Whether to stop execution on first error (default: true)',
          default: true,
        },
        timeout: {
          type: 'number',
          description: 'Maximum execution time in milliseconds (default: 300000)',
          default: 300000,
        },
      },
      required: ['steps'],
    };

    const executeConfig: ExecuteConfig = {
      method: 'LOCAL',
      url: 'local://execute-tool-chain',
      bodyType: 'json',
      params: [],
    };

    super(
      'execute_tool_chain',
      `Execute multiple tools in sequence with parameter passing between steps. ${BETA_WARNING}`,
      parameters,
      executeConfig
    );

    this.tools = tools;
  }

  /**
   * Execute the tool chain
   */
  async execute(inputParams?: JsonDict | string): Promise<JsonDict> {
    const startTime = Date.now();

    try {
      const params = typeof inputParams === 'string' ? JSON.parse(inputParams) : inputParams || {};
      const config = params as ToolChainConfig;

      if (!config.steps || toArray(config.steps).length === 0) {
        throw new StackOneError('Steps array is required and must not be empty');
      }

      const result = await this.executeChain(config);

      return {
        ...result,
        beta: true,
        warning: BETA_WARNING,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      if (error instanceof StackOneError) {
        throw error;
      }

      return {
        success: false,
        stepResults: [],
        executionTime,
        error: error instanceof Error ? error.message : String(error),
        beta: true,
        warning: BETA_WARNING,
      };
    }
  }

  /**
   * Execute the tool chain
   */
  private async executeChain(config: ToolChainConfig): Promise<ToolChainResult> {
    const { accountId, stopOnError = true, timeout = 300000 } = config;
    const steps = toArray(config.steps);
    const startTime = Date.now();
    const stepResults: ToolChainStepResult[] = [];

    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error(`Tool chain execution timed out after ${timeout}ms`)),
        timeout
      );
    });

    try {
      // Execute with timeout
      await Promise.race([
        this.executeSteps(steps, stepResults, accountId, stopOnError),
        timeoutPromise,
      ]);

      const executionTime = Date.now() - startTime;
      const success = stepResults.every((result) => result.success || result.skipped);

      return {
        success,
        stepResults,
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      return {
        success: false,
        stepResults,
        executionTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute the steps sequentially
   */
  private async executeSteps(
    steps: ToolChainStep[],
    stepResults: ToolChainStepResult[],
    accountId?: string,
    stopOnError = true
  ): Promise<void> {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepStartTime = Date.now();

      try {
        // Check condition if provided
        if (step.condition) {
          const shouldExecute = this.evaluateCondition(step.condition, stepResults);
          if (!shouldExecute) {
            stepResults.push({
              stepIndex: i,
              stepName: step.stepName || step.toolName,
              toolName: step.toolName,
              success: true,
              skipped: true,
              executionTime: Date.now() - stepStartTime,
            });
            continue;
          }
        }

        // Get the tool
        const tool = this.tools.getTool(step.toolName);
        if (!tool) {
          throw new Error(`Tool not found: ${step.toolName}`);
        }

        // Set account ID if provided and tool is StackOne tool
        if (accountId && tool instanceof StackOneTool) {
          tool.setAccountId(accountId);
        }

        // Process parameters with template substitution
        const processedParams = this.processParameters(step.parameters, stepResults);

        // Execute the tool
        const result = await tool.execute(processedParams);

        stepResults.push({
          stepIndex: i,
          stepName: step.stepName || step.toolName,
          toolName: step.toolName,
          success: true,
          result,
          executionTime: Date.now() - stepStartTime,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        stepResults.push({
          stepIndex: i,
          stepName: step.stepName || step.toolName,
          toolName: step.toolName,
          success: false,
          error: errorMessage,
          executionTime: Date.now() - stepStartTime,
        });

        if (stopOnError && !step.continueOnError) {
          throw new Error(`Step ${i} (${step.stepName || step.toolName}) failed: ${errorMessage}`);
        }
      }
    }
  }

  /**
   * Evaluate a condition expression
   */
  private evaluateCondition(condition: string, stepResults: ToolChainStepResult[]): boolean {
    try {
      // Replace template variables with actual values
      const processedCondition = this.replaceTemplateVariables(condition, stepResults);

      // Create a safe evaluation context
      const context = {
        step: stepResults.reduce(
          (acc, result, index) => {
            acc[index] = result;
            return acc;
          },
          {} as Record<number, ToolChainStepResult>
        ),
      };

      // Use Function constructor for safer evaluation
      const evaluator = new Function('context', `with(context) { return ${processedCondition}; }`);
      return evaluator(context);
    } catch (error) {
      console.warn(`Failed to evaluate condition: ${condition}`, error);
      return false;
    }
  }

  /**
   * Process parameters by replacing template variables
   */
  private processParameters(parameters: JsonDict, stepResults: ToolChainStepResult[]): JsonDict {
    const processedParams: JsonDict = {};

    for (const [key, value] of Object.entries(parameters)) {
      if (typeof value === 'string') {
        processedParams[key] = this.replaceTemplateVariables(value, stepResults);
      } else if (typeof value === 'object' && value !== null) {
        processedParams[key] = this.processParameters(value as JsonDict, stepResults);
      } else {
        processedParams[key] = value;
      }
    }

    return processedParams;
  }

  /**
   * Replace template variables in a string
   */
  private replaceTemplateVariables(
    template: string,
    stepResults: ToolChainStepResult[]
  ): string | unknown {
    // Check if the entire string is a template variable
    const fullMatch = template.match(/^\{\{step(\d+)\.(.+?)\}\}$/);
    if (fullMatch) {
      const [, stepIndex, path] = fullMatch;
      const index = Number.parseInt(stepIndex, 10);
      const result = stepResults[index];

      if (!result) {
        return template; // Keep original if step not found
      }

      // Navigate the path
      const pathParts = path.split('.');
      let value: unknown = result;

      for (const part of pathParts) {
        if (value && typeof value === 'object' && value !== null && part in value) {
          value = (value as Record<string, unknown>)[part];
        } else {
          return template; // Keep original if path not found
        }
      }

      return value; // Return the actual value, not stringified
    }

    // Otherwise, replace inline template variables
    return template.replace(/\{\{step(\d+)\.(.+?)\}\}/g, (match, stepIndex, path) => {
      const index = Number.parseInt(stepIndex, 10);
      const result = stepResults[index];

      if (!result) {
        return match; // Keep original if step not found
      }

      // Navigate the path
      const pathParts = path.split('.');
      let value: unknown = result;

      for (const part of pathParts) {
        if (value && typeof value === 'object' && value !== null && part in value) {
          value = (value as Record<string, unknown>)[part];
        } else {
          return match; // Keep original if path not found
        }
      }

      return String(value);
    });
  }
}
