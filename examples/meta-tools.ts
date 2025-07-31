/**
 * Meta Tools Example
 *
 * This example demonstrates how to use the beta meta tools for intelligent
 * tool discovery and orchestration.
 *
 * @beta These are beta features and may change in future versions
 */

import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { StackOneToolSet } from '../src';
import { ACCOUNT_IDS } from './constants';

// Example 1: Using GetRelevantTools to discover tools
async function discoverToolsExample() {
  console.log('\n=== Example 1: Discovering Relevant Tools ===');

  const toolset = new StackOneToolSet();
  const tools = toolset.getStackOneTools(['*']); // Use wildcard to avoid warning

  // Get the get_relevant_tools meta tool
  const relevantToolsFinder = tools.getTool('get_relevant_tools');

  if (!relevantToolsFinder) {
    console.error('get_relevant_tools not found');
    return;
  }

  // Example queries for different use cases
  const queries = [
    'list employees',
    'get employee',
    'create employee',
    'list companies',
    'get company',
    'list applications',
  ];

  for (const query of queries) {
    console.log(`\nSearching for: "${query}"`);
    const result = await relevantToolsFinder.execute({
      query,
      limit: 3,
      minScore: 0.5,
    });

    console.log(`Found ${result.resultsCount} tools:`);
    for (const tool of result.tools as Array<{
      name: string;
      score: number;
      matchReason: string;
    }>) {
      console.log(`  - ${tool.name} (score: ${tool.score.toFixed(2)}) - ${tool.matchReason}`);
    }
  }
}

// Example 2: Using ExecuteToolChain for complex workflows
async function toolChainExample() {
  console.log('\n=== Example 2: Executing Tool Chains ===');

  const toolset = new StackOneToolSet();
  const tools = toolset.getStackOneTools(['*'], ACCOUNT_IDS.HRIS); // Use wildcard to avoid warning

  // Get the execute_tool_chain meta tool
  const toolChain = tools.getTool('execute_tool_chain');

  if (!toolChain) {
    console.error('execute_tool_chain not found');
    return;
  }

  // Example: Employee onboarding workflow
  console.log('\nExecuting employee onboarding workflow...');

  const result = await toolChain.execute({
    steps: [
      {
        toolName: 'hris_list_employees',
        parameters: {
          filter: {
            updated_after: '2024-01-01T00:00:00Z',
          },
          page_size: '10',
        },
        stepName: 'Get recent employees',
      },
      {
        toolName: 'hris_get_employee',
        parameters: {
          id: '{{step0.result.items[0].id}}', // Get first employee ID
        },
        stepName: 'Get employee details',
        condition: '{{step0.result.items.length}} > 0',
      },
    ],
    accountId: ACCOUNT_IDS.HRIS,
  });

  console.log(`\nWorkflow execution ${result.success ? 'succeeded' : 'failed'}`);
  console.log(`Total execution time: ${result.executionTime}ms`);

  for (const step of result.stepResults as Array<{
    stepIndex: number;
    stepName: string;
    success: boolean;
    skipped?: boolean;
    error?: string;
  }>) {
    console.log(`\nStep ${step.stepIndex + 1}: ${step.stepName}`);
    console.log(`  Status: ${step.success ? 'Success' : 'Failed'}`);
    if (step.skipped) {
      console.log('  Skipped due to condition');
    }
    if (step.error) {
      console.log(`  Error: ${step.error}`);
    }
  }
}

// Example 3: Using meta tools with AI agents
async function aiAgentExample() {
  console.log('\n=== Example 3: Meta Tools with AI Agents ===');

  // Check if OpenAI API key is set
  if (!process.env.OPENAI_API_KEY) {
    console.log('Skipping AI agent example - OPENAI_API_KEY environment variable not set');
    return;
  }

  const toolset = new StackOneToolSet();
  // Limit tools to HRIS tools only (plus meta tools) to stay under 128 limit
  const tools = toolset.getStackOneTools(
    ['hris_*', 'get_relevant_tools', 'execute_tool_chain'],
    ACCOUNT_IDS.HRIS
  );

  // Convert tools to AI SDK format (includes meta tools)
  const aiTools = tools.toAISDK();

  try {
    // Use with AI agent
    const { text, toolCalls } = await generateText({
      model: openai('gpt-4o-mini'),
      tools: aiTools,
      prompt: `You are an HR assistant. First, use get_relevant_tools to find tools 
               related to listing employees. Then use execute_tool_chain to get the 
               list of employees and fetch details for the first one.`,
      maxSteps: 5,
    });

    console.log('\nAI Agent Response:');
    console.log(text);

    console.log('\nTool calls made:');
    for (const call of toolCalls || []) {
      console.log(`- ${call.toolName}`);
    }
  } catch (error) {
    console.error('Error in AI agent example:', error instanceof Error ? error.message : error);
  }
}

// Example 4: Filtering with meta tools
async function filteringExample() {
  console.log('\n=== Example 4: Filtering with Meta Tools ===');

  const toolset = new StackOneToolSet();

  // Include only HRIS tools and meta tools
  const hrisAndMetaTools = toolset.getStackOneTools([
    'hris_*',
    'get_relevant_tools',
    'execute_tool_chain',
  ]);

  console.log(`\nTotal tools available: ${hrisAndMetaTools.length}`);

  // Exclude meta tools
  const noMetaTools = toolset.getStackOneTools(['*', '!get_relevant_tools', '!execute_tool_chain']);

  console.log(`Tools without meta tools: ${noMetaTools.length}`);

  // Disable meta tools entirely
  const toolsetNoMeta = new StackOneToolSet({ includeMetaTools: false });
  const allToolsNoMeta = toolsetNoMeta.getStackOneTools();

  console.log(`Tools with meta tools disabled: ${allToolsNoMeta.length}`);
}

// Main execution
async function main() {
  console.log('Meta Tools Examples (Beta)');
  console.log('==========================');
  console.log('Note: These are beta features and may change in future versions.\n');

  try {
    await discoverToolsExample();
    await toolChainExample();
    await aiAgentExample();
    await filteringExample();
  } catch (error) {
    console.error('Error in examples:', error);
  }
}

// Only run if this file is executed directly
if (import.meta.main) {
  main();
}
