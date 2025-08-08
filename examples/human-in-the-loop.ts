/**
 * Example showing how to do human-in-the-loop workflows with StackOne using the split functionality.
 * This allows for more granular control over tool execution and validation.
 *
 * Run this with:
 * bun run examples/human-in-the-loop.ts
 */

import { assert } from 'node:console';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { StackOneToolSet } from '../src';
import type { JsonDict } from '../src/types';
import { ACCOUNT_IDS } from './constants';

interface ToolCall {
  toolName: string;
  args: Record<string, unknown>;
}

const humanInTheLoopExample = async (): Promise<void> => {
  // Create a toolset
  const toolset = new StackOneToolSet();
  const hrisAccountId = ACCOUNT_IDS.HRIS;

  // Get the create employee tool
  const createEmployeeTool = toolset.getTool('hris_create_employee', {
    'x-account-id': hrisAccountId,
  });

  if (!createEmployeeTool) {
    throw new Error('Create employee tool not found');
  }

  // Get the AI SDK version of the tool without the execute function
  const tool = createEmployeeTool.toAISDK({
    executable: false,
  });

  // Use the metadata for AI planning/generation
  const { toolCalls } = await generateText({
    model: openai('gpt-5'),
    tools: tool,
    prompt:
      'Create a new employee in Workday, params: Full name: John Doe, personal email: john.doe@example.com, department: Engineering, start date: 2025-01-01, hire date: 2025-01-01',
    maxSteps: 1,
  });

  // Human validation and modification step
  const toolCall = toolCalls[0] as ToolCall;
  const shouldExecute = await simulateHumanValidation(toolCall);

  // Map of tool names to execution functions
  const executions: Record<string, (args: Record<string, unknown>) => Promise<JsonDict>> = {
    hris_create_employee: (args) => createEmployeeTool.execute(args as JsonDict),
  };

  // Execute the tool if approved
  if (shouldExecute && toolCall.toolName in executions) {
    // You would call the tool here
    // const result = await executions[toolCall.toolName](toolCall.args);
  } else {
    console.log('Tool execution was not approved or tool not found');
  }
};

// Simulate human validation (in a real app, this would be your UI component)
const simulateHumanValidation = async (toolCall: ToolCall): Promise<boolean> => {
  // This is where you'd implement your UI for human validation
  assert(toolCall.toolName === 'hris_create_employee', 'Tool name is not hris_create_employee');
  assert(toolCall.args.name === 'John Doe', 'Name is not John Doe');
  assert(
    toolCall.args.personal_email === 'john.doe@example.com',
    'Email is not john.doe@example.com'
  );
  assert(toolCall.args.department === 'Engineering', 'Department is not Engineering');
  assert(toolCall.args.start_date === '2025-01-01', 'Start date is not 2025-01-01');
  assert(toolCall.args.hire_date === '2025-01-01', 'Hire date is not 2025-01-01');

  // In a real application, you might show a UI that allows the user to:
  // 1. Review the parameters
  // 2. Edit parameter values if needed
  // 3. Approve or reject the execution

  // For this example, we'll just approve automatically
  return true;
};

humanInTheLoopExample();
