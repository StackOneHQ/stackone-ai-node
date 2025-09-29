import { z } from 'zod';
import { BaseTool } from '../tool';
import type { ExecuteConfig, ExecuteOptions, JsonDict, ToolParameters } from '../types';
import { StackOneError } from '../utils/errors';

interface FeedbackToolOptions {
  defaultEndpoint?: string;
}

const createNonEmptyTrimmedStringSchema = (fieldName: string) =>
  z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, {
      message: `${fieldName} must be a non-empty string.`,
    });

const createOptionalTrimmedStringSchema = () =>
  z
    .string()
    .optional()
    .transform((value) => {
      if (typeof value !== 'string') {
        return undefined;
      }
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    });

const feedbackInputSchema = z.object({
  feedback: createNonEmptyTrimmedStringSchema('Feedback'),
  accountId: createNonEmptyTrimmedStringSchema('accountId'),
  feedbackEndpoint: createOptionalTrimmedStringSchema(),
  toolNames: z
    .array(z.string())
    .optional()
    .transform((value) => {
      if (!value) {
        return undefined;
      }
      const sanitized = value.map((item) => item.trim()).filter((item) => item.length > 0);
      return sanitized.length > 0 ? sanitized : undefined;
    }),
});

export function createFeedbackTool(options: FeedbackToolOptions = {}): BaseTool {
  const name = 'meta_collect_tool_feedback' as const;
  const description =
    'Collects user feedback on StackOne tool performance. First ask the user, “Are you ok with sending feedback to StackOne?” and mention that the LLM will take care of sending it. Call this tool only when the user explicitly answers yes.';
  const parameters = {
    type: 'object',
    properties: {
      accountId: {
        type: 'string',
        description: 'Identifier for the StackOne account associated with this feedback.',
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
        description: 'Optional list of tool names or workflows the feedback references.',
      },
      feedbackEndpoint: {
        type: 'string',
        description:
          'Override the default feedback collection URL for this submission. Defaults to the configured StackOne feedback endpoint.',
      },
    },
    required: ['feedback', 'accountId'],
  } as const satisfies ToolParameters;

  const executeConfig = {
    method: 'LOCAL',
    url: 'local://collect-feedback',
    bodyType: 'json',
    params: [],
  } as const satisfies ExecuteConfig;

  const tool = new BaseTool(name, description, parameters, executeConfig);
  const defaultEndpoint = options.defaultEndpoint;

  tool.execute = async function (
    this: BaseTool,
    inputParams?: JsonDict | string,
    options?: ExecuteOptions
  ): Promise<JsonDict> {
    try {
      const rawParams =
        typeof inputParams === 'string' ? JSON.parse(inputParams) : inputParams || {};
      const parsedParams = feedbackInputSchema.parse(rawParams);

      const endpointCandidate =
        parsedParams.feedbackEndpoint || defaultEndpoint || process.env.STACKONE_FEEDBACK_URL;

      if (!endpointCandidate) {
        throw new StackOneError(
          'No feedback endpoint configured. Set STACKONE_FEEDBACK_URL in the environment, configure feedbackUrl on the StackOneToolSet, or provide feedbackEndpoint in the tool call.'
        );
      }

      const submission: Record<string, unknown> = {
        feedback: parsedParams.feedback,
        accountId: parsedParams.accountId,
        submittedAt: new Date().toISOString(),
        source: 'stackone-ai-node',
      };

      if (parsedParams.toolNames) {
        submission.toolNames = parsedParams.toolNames;
      }

      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...this.getHeaders(),
      };

      if (options?.dryRun) {
        return {
          endpoint: endpointCandidate,
          payload: submission,
        } satisfies JsonDict;
      }

      const response = await fetch(endpointCandidate, {
        method: 'POST',
        headers,
        body: JSON.stringify(submission),
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

      return {
        status: 'submitted',
        endpoint: endpointCandidate,
        response: parsed,
      } satisfies JsonDict;
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
