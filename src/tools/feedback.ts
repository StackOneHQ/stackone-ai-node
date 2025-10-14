import { z } from 'zod';
import { BaseTool } from '../tool';
import type { ExecuteConfig, ExecuteOptions, JsonDict, ToolParameters } from '../types';
import { StackOneError } from '../utils/errors';

interface FeedbackToolOptions {
  baseUrl?: string;
}

const createNonEmptyTrimmedStringSchema = (fieldName: string) =>
  z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, {
      message: `${fieldName} must be a non-empty string.`,
    });

const feedbackInputSchema = z.object({
  feedback: createNonEmptyTrimmedStringSchema('Feedback'),
  account_id: createNonEmptyTrimmedStringSchema('Account ID'),
  toolNames: z
    .array(z.string())
    .min(1, 'At least one tool name is required')
    .transform((value) => value.map((item) => item.trim()).filter((item) => item.length > 0)),
});

export function createFeedbackTool(options: FeedbackToolOptions = {}): BaseTool {
  const name = 'meta_collect_tool_feedback' as const;
  const description =
    'Collects user feedback on StackOne tool performance. First ask the user, "Are you ok with sending feedback to StackOne?" and mention that the LLM will take care of sending it. Call this tool only when the user explicitly answers yes.';
  const parameters = {
    type: 'object',
    properties: {
      account_id: {
        type: 'string',
        description: 'Account identifier (e.g., "acc_123456")',
      },
      feedback: {
        type: 'string',
        description: 'Verbatim feedback from the user about their experience with StackOne tools.',
      },
      toolNames: {
        type: 'array',
        items: {
          type: 'string',
        },
        description: 'Array of tool names being reviewed',
      },
    },
    required: ['feedback', 'account_id', 'toolNames'],
  } as const satisfies ToolParameters;

  const executeConfig = {
    method: 'POST',
    url: '/ai/tool-feedback',
    bodyType: 'json',
    params: [],
  } as const satisfies ExecuteConfig;

  const tool = new BaseTool(name, description, parameters, executeConfig);
  const baseUrl = options.baseUrl || 'https://api.stackone.com';

  tool.execute = async function (
    this: BaseTool,
    inputParams?: JsonDict | string,
    executeOptions?: ExecuteOptions
  ): Promise<JsonDict> {
    try {
      const rawParams =
        typeof inputParams === 'string' ? JSON.parse(inputParams) : inputParams || {};
      const parsedParams = feedbackInputSchema.parse(rawParams);

      const requestBody = {
        feedback: parsedParams.feedback,
        account_id: parsedParams.account_id,
        tool_names: parsedParams.toolNames,
      };

      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...this.getHeaders(),
      };

      if (executeOptions?.dryRun) {
        return {
          url: `${baseUrl}${executeConfig.url}`,
          method: executeConfig.method,
          headers,
          body: {
            feedback: parsedParams.feedback,
            account_id: parsedParams.account_id,
            tool_names: parsedParams.toolNames,
          },
        } satisfies JsonDict;
      }

      const response = await fetch(`${baseUrl}${executeConfig.url}`, {
        method: executeConfig.method,
        headers,
        body: JSON.stringify(requestBody),
      });

      const text = await response.text();
      let parsed: unknown;
      try {
        parsed = text ? JSON.parse(text) : {};
      } catch (_error) {
        parsed = { raw: text };
      }

      if (!response.ok) {
        throw new StackOneError(
          `Failed to submit feedback. Status: ${response.status}. Response: ${JSON.stringify(parsed)}`
        );
      }

      return parsed as JsonDict;
    } catch (error) {
      if (error instanceof StackOneError) {
        throw error;
      }
      throw new StackOneError(
        `Error executing tool: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  return tool;
}
