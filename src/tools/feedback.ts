import { BaseTool } from '../tool';
import type { ExecuteConfig, ExecuteOptions, JsonDict, ToolParameters } from '../types';
import { StackOneError } from '../utils/errors';

interface FeedbackToolOptions {
  defaultEndpoint?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function createFeedbackTool(options: FeedbackToolOptions = {}): BaseTool {
  const name = 'meta_collect_tool_feedback' as const;
  const description =
    'Collects user feedback on StackOne tool performance. First ask the user, “Are you ok with sending feedback to StackOne?” and mention that the LLM will take care of sending it. Call this tool only when the user explicitly answers yes.';
  const parameters = {
    type: 'object',
    properties: {
      consentGranted: {
        type: 'boolean',
        description:
          'Set to true only if the user explicitly agreed to share their feedback with StackOne.',
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
      toolChronology: {
        type: 'array',
        description:
          'Optional chronological trace of tools used in this session, each entry describing one invocation.',
        items: {
          type: 'object',
          properties: {
            toolName: {
              type: 'string',
              description: 'Name of the tool that was invoked.',
            },
            calledAt: {
              type: 'string',
              description: 'Timestamp (ISO 8601 recommended) for when the tool ran.',
            },
            notes: {
              type: 'string',
              description: 'Optional notes about the tool execution outcome.',
            },
            durationMs: {
              type: 'number',
              description: 'Optional execution duration for the tool invocation in milliseconds.',
            },
            provider: {
              type: 'string',
              description: 'Optional provider identifier associated with the tool invocation.',
            },
          },
          required: ['toolName'],
          additionalProperties: true,
        },
      },
      contactOk: {
        type: 'boolean',
        description: 'Whether StackOne may follow up with the user about their feedback.',
      },
      metadata: {
        type: 'object',
        description: 'Optional additional context about the feedback, provided as key-value pairs.',
        additionalProperties: true,
      },
      totalToolsCalled: {
        type: 'number',
        description: 'Optional count of tool invocations during the feedback session.',
      },
      feedbackEndpoint: {
        type: 'string',
        description:
          'Override the default feedback collection URL for this submission. Defaults to the configured StackOne feedback endpoint.',
      },
    },
    required: ['consentGranted', 'feedback'],
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
      if (
        inputParams !== undefined &&
        typeof inputParams !== 'string' &&
        typeof inputParams !== 'object'
      ) {
        throw new StackOneError(
          `Invalid parameters type. Expected object or string, got ${typeof inputParams}. Parameters: ${JSON.stringify(inputParams)}`
        );
      }

      const params = typeof inputParams === 'string' ? JSON.parse(inputParams) : inputParams || {};
      const consentGranted = params.consentGranted === true;
      if (!consentGranted) {
        throw new StackOneError(
          'User consent not granted. Ask the user for permission before calling this tool and set consentGranted to true.'
        );
      }

      const feedback = typeof params.feedback === 'string' ? params.feedback.trim() : '';
      if (!feedback) {
        throw new StackOneError('Feedback must be a non-empty string.');
      }

      const endpointCandidate =
        (typeof params.feedbackEndpoint === 'string' && params.feedbackEndpoint.trim()) ||
        defaultEndpoint ||
        process.env.STACKONE_FEEDBACK_URL;

      if (!endpointCandidate) {
        throw new StackOneError(
          'No feedback endpoint configured. Set STACKONE_FEEDBACK_URL in the environment, configure feedbackUrl on the StackOneToolSet, or provide feedbackEndpoint in the tool call.'
        );
      }

      const submission: Record<string, unknown> = {
        consentGranted: true,
        feedback,
        submittedAt: new Date().toISOString(),
      };

      if (Array.isArray(params.toolNames)) {
        const normalized = params.toolNames.reduce<string[]>((acc, value) => {
          if (typeof value !== 'string') return acc;
          const trimmed = value.trim();
          if (!trimmed) return acc;
          acc.push(trimmed);
          return acc;
        }, []);
        if (normalized.length > 0) {
          submission.toolNames = normalized;
        }
      }

      if (params.contactOk !== undefined) {
        submission.contactOk = Boolean(params.contactOk);
      }

      if (isRecord(params.metadata)) {
        submission.metadata = params.metadata;
      }

      if (Array.isArray(params.toolChronology)) {
        const chronology = params.toolChronology.reduce<Record<string, unknown>[]>((acc, entry) => {
          if (!isRecord(entry)) return acc;
          const toolName = typeof entry.toolName === 'string' ? entry.toolName.trim() : '';
          if (!toolName) return acc;

          const sanitized: Record<string, unknown> = { toolName };

          if (typeof entry.calledAt === 'string') {
            const calledAt = entry.calledAt.trim();
            if (calledAt) {
              sanitized.calledAt = calledAt;
            }
          }

          if (typeof entry.notes === 'string') {
            const notes = entry.notes.trim();
            if (notes) {
              sanitized.notes = notes;
            }
          }

          // Preserve any additional properties as-is
          for (const [key, value] of Object.entries(entry)) {
            if (key === 'toolName' || key === 'calledAt' || key === 'notes') continue;
            sanitized[key] = value;
          }

          acc.push(sanitized);
          return acc;
        }, []);

        if (chronology.length > 0) {
          submission.toolChronology = chronology;
        }
      }

      if (typeof params.totalToolsCalled === 'number') {
        if (Number.isFinite(params.totalToolsCalled) && params.totalToolsCalled >= 0) {
          submission.totalToolsCalled = Math.trunc(params.totalToolsCalled);
        }
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
