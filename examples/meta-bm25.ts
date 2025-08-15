/**
 * This example demonstrates how to use meta tools for dynamic tool discovery and execution.
 * Meta tools allow AI agents to search for relevant tools based on natural language queries
 * and execute them dynamically without hardcoding tool names.
 *
 * @beta Meta tools are in beta and may change in future versions
 */

import process from 'node:process';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { StackOneToolSet } from '../src';
import { ACCOUNT_IDS } from './constants';

/**
 * Example 1: Using meta tools with AI SDK for dynamic tool discovery
 */
const metaToolsWithAISDK = async (): Promise<void> => {
  console.log('🔍 Example 1: Dynamic tool discovery with AI SDK\n');

  // Initialize StackOne toolset with all available tools
  const toolset = new StackOneToolSet();
  const accountId = ACCOUNT_IDS.HRIS;

  // Get all available tools for the account
  const allTools = toolset.getStackOneTools('*', accountId);

  // Get meta tools for dynamic discovery and execution
  const metaTools = await allTools.metaTools();
  const aiSdkMetaTools = metaTools.toAISDK();

  // Use meta tools to dynamically find and execute relevant tools
  const { text, toolCalls } = await generateText({
    model: openai('gpt-4o-mini'),
    tools: aiSdkMetaTools,
    prompt: `I need to create a time off request for an employee. 
    First, find the right tool for this task, then use it to create a time off request 
    for employee ID "emp_123" from January 15, 2024 to January 19, 2024.`,
    maxSteps: 3, // Allow multiple tool calls
  });

  console.log('AI Response:', text);
  console.log('\nTool calls made:', toolCalls?.map((call) => call.toolName).join(', '));
};

/**
 * Example 2: Using meta tools with OpenAI for HR assistant
 */
const metaToolsWithOpenAI = async (): Promise<void> => {
  console.log('\n🤖 Example 2: HR Assistant with OpenAI\n');

  const { OpenAI } = await import('openai');
  const openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Initialize StackOne toolset
  const toolset = new StackOneToolSet();
  const accountId = ACCOUNT_IDS.HRIS;

  // Get all HRIS tools
  const hrisTools = toolset.getStackOneTools('hris_*', accountId);

  // Get meta tools
  const metaTools = await hrisTools.metaTools();
  const openAIMetaTools = metaTools.toOpenAI();

  // Create an HR assistant that can discover and use tools dynamically
  const response = await openaiClient.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are an HR assistant with access to various HR tools. 
        Use the meta_filter_relevant_tools to find appropriate tools for user requests,
        then use meta_execute_tool to execute them.`,
      },
      {
        role: 'user',
        content:
          'Can you help me find tools for managing employee records and then list current employees?',
      },
    ],
    tools: openAIMetaTools,
    tool_choice: 'auto',
  });

  console.log('Assistant response:', response.choices[0].message.content);

  // Handle tool calls if any
  if (response.choices[0].message.tool_calls) {
    console.log('\nTool calls:');
    for (const toolCall of response.choices[0].message.tool_calls) {
      console.log(`- ${toolCall.function.name}: ${toolCall.function.arguments}`);
    }
  }
};

/**
 * Example 3: Direct usage of meta tools without AI
 */
const directMetaToolUsage = async (): Promise<void> => {
  console.log('\n🛠️  Example 3: Direct meta tool usage\n');

  // Initialize toolset
  const toolset = new StackOneToolSet();
  const accountId = ACCOUNT_IDS.HRIS;

  // Get all available tools
  const allTools = toolset.getStackOneTools('*', accountId);
  console.log(`Total available tools: ${allTools.length}`);

  // Get meta tools
  const metaTools = await allTools.metaTools();

  // Step 1: Search for relevant tools
  const filterTool = metaTools.getTool('meta_filter_relevant_tools');
  if (!filterTool) throw new Error('meta_filter_relevant_tools not found');
  const searchResult = await filterTool.execute({
    query: 'employee management create update list',
    limit: 5,
    minScore: 0.3,
  });

  console.log('Found relevant tools:');
  const foundTools = searchResult.tools as Array<{
    name: string;
    description: string;
    score: number;
  }>;
  for (const tool of foundTools) {
    console.log(`- ${tool.name} (score: ${tool.score.toFixed(2)}): ${tool.description}`);
  }

  // Step 2: Execute one of the found tools
  if (foundTools.length > 0) {
    const executeTool = metaTools.getTool('meta_execute_tool');
    if (!executeTool) throw new Error('meta_execute_tool not found');
    const firstTool = foundTools[0];

    console.log(`\nExecuting ${firstTool.name}...`);

    try {
      // Prepare parameters based on the tool's schema
      let params: Record<string, unknown> = {};
      if (firstTool.name === 'hris_list_employees') {
        params = { limit: 5 };
      } else if (firstTool.name === 'hris_create_employee') {
        params = {
          name: 'John Doe',
          email: 'john.doe@example.com',
          title: 'Software Engineer',
        };
      }

      const result = await executeTool.execute({
        toolName: firstTool.name,
        params: params,
      });

      console.log('Execution result:', JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('Execution failed:', error);
    }
  }
};

/**
 * Example 4: Building a dynamic tool router
 */
const dynamicToolRouter = async (): Promise<void> => {
  console.log('\n🔄 Example 4: Dynamic tool router\n');

  const toolset = new StackOneToolSet();
  const accountId = ACCOUNT_IDS.HRIS;

  // Get tools from multiple categories
  const hrisTools = toolset.getStackOneTools('hris_*', accountId);
  const atsTools = toolset.getStackOneTools('ats_*', accountId);

  // Combine tools
  const combinedTools = new (await import('../src')).Tools([
    ...hrisTools.toArray(),
    ...atsTools.toArray(),
  ]);

  // Get meta tools for the combined set
  const metaTools = await combinedTools.metaTools();

  // Create a router function that finds and executes tools based on intent
  const routeAndExecute = async (intent: string, params: Record<string, unknown> = {}) => {
    const filterTool = metaTools.getTool('meta_filter_relevant_tools');
    const executeTool = metaTools.getTool('meta_execute_tool');
    if (!filterTool || !executeTool) throw new Error('Meta tools not found');

    // Find relevant tools
    const searchResult = await filterTool.execute({
      query: intent,
      limit: 1,
      minScore: 0.5,
    });

    const tools = searchResult.tools as Array<{ name: string; score: number }>;
    if (tools.length === 0) {
      return { error: 'No relevant tools found for the given intent' };
    }

    const selectedTool = tools[0];
    console.log(`Routing to: ${selectedTool.name} (score: ${selectedTool.score.toFixed(2)})`);

    // Execute the selected tool
    return await executeTool.execute({
      toolName: selectedTool.name,
      params: params,
    });
  };

  // Test the router with different intents
  const intents = [
    { intent: 'I want to see all employees', params: { limit: 10 } },
    {
      intent: 'Create a new job candidate',
      params: { name: 'Jane Smith', email: 'jane@example.com' },
    },
    { intent: 'Find recruitment candidates', params: { status: 'active' } },
  ];

  for (const { intent, params } of intents) {
    console.log(`\nIntent: "${intent}"`);
    const result = await routeAndExecute(intent, params);
    console.log('Result:', JSON.stringify(result, null, 2));
  }
};

// Main execution
const main = async () => {
  try {
    // Run examples based on environment setup
    if (process.env.OPENAI_API_KEY) {
      await metaToolsWithAISDK();
      await metaToolsWithOpenAI();
    } else {
      console.log('⚠️  OPENAI_API_KEY not found, skipping AI examples\n');
    }

    // These examples work without AI
    await directMetaToolUsage();
    await dynamicToolRouter();
  } catch (error) {
    console.error('Error running examples:', error);
  }
};

// Run if this file is executed directly
if (import.meta.main) {
  main();
}

export { metaToolsWithAISDK, metaToolsWithOpenAI, directMetaToolUsage, dynamicToolRouter };
