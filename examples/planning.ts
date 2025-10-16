/**
 * While building agents you may find that your workflow is too complex for a general purpose agent.
 *
 * StackOne AI SDK provides access to a state of the art planning agent which allows you to create, cache, and execute complex workflows on [verticals supported by StackOne](https://www.stackone.com/integrations).
 *
 * For example, onboard a new hire from your ATS to your HRIS.
 */

import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { StackOneToolSet } from '../src';
import { ACCOUNT_IDS } from './constants';

export const planningModule = async (): Promise<void> => {
  const toolset = new StackOneToolSet();

  const onboardWorkflow = await toolset.plan({
    key: 'custom_onboarding',
    input: 'Onboard the last new hire from Teamtailor to Workday',
    model: 'stackone-planner-latest',
    tools: ['hris_*', 'ats_*'],
    accountIds: [ACCOUNT_IDS.ATS, ACCOUNT_IDS.HRIS],
    cache: true, // saves the plan to $HOME/.stackone/plans
  });

  await onboardWorkflow.execute();

  /**
   * or use as part of a larger agent (using AI SDK by Vercel)
   */
  await generateText({
    model: openai('gpt-5'),
    prompt: 'You are a workplace agent, onboard the latest hires to our systems',
    tools: await onboardWorkflow.toAISDK(),
    maxSteps: 3,
  });
};

console.log('Planning module is in closed beta and only available to design partners.');
console.log('Apply for the waitlist [here](https://www.stackone.com/demo).');
