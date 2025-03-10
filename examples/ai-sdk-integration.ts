/**
 * This example shows how to use StackOne tools with the AI SDK.
 */

import assert from 'node:assert';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { StackOneToolSet } from '../src';

const aiSdkIntegration = async (): Promise<void> => {
  // Initialize StackOne
  const toolset = new StackOneToolSet();
  const accountId = '45072196112816593343';

  // Get HRIS tools
  const tools = toolset.getStackOneTools('hris_*', accountId);

  // Convert to AI SDK tools
  const aiSdkTools = tools.toAISDK();

  // Use max steps to automatically call the tool if it's needed
  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    tools: aiSdkTools,
    prompt: 'Get all details about employee with id: c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA',
    maxSteps: 3,
  });

  assert(text.includes('Isac Newton'), 'Expected employee name to be included in the response');
};

aiSdkIntegration();
