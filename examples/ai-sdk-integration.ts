/**
 * This example shows how to use StackOne tools with the AI SDK.
 */

import assert from 'node:assert';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { StackOneToolSet } from '../src';
import { ACCOUNT_IDS } from './constants';

const aiSdkIntegration = async (): Promise<void> => {
  // Initialize StackOne
  const toolset = new StackOneToolSet();
  const accountId = ACCOUNT_IDS.HRIS;

  // Get HRIS tools
  const tools = toolset.getStackOneTools('hris_get_*', accountId);

  // Convert to AI SDK tools
  const aiSdkTools = tools.toAISDK();

  // Use max steps to automatically call the tool if it's needed
  const { text } = await generateText({
    model: openai('gpt-5'),
    tools: aiSdkTools,
    prompt: 'Get all details about employee with id: c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA',
    maxSteps: 3,
  });

  assert(text.includes('Michael'), 'Expected employee name to be included in the response');
};

aiSdkIntegration();
