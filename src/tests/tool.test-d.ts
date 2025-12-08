import type { ChatCompletionFunctionTool } from 'openai/resources/chat/completions';
import { assertType, test } from 'vitest';
import { BaseTool, Tools } from '../tool';
import type { AISDKToolResult } from '../types';

const tool = new BaseTool(
  'test_tool',
  'Test tool',
  {
    type: 'object',
    properties: { id: { type: 'string' } },
  },
  {
    kind: 'http',
    method: 'GET',
    url: 'https://example.com/test',
    bodyType: 'json',
    params: [],
  }
);

const tools = new Tools([tool]);

test('BaseTool.toOpenAI returns ChatCompletionFunctionTool', () => {
  const result = tool.toOpenAI();
  assertType<ChatCompletionFunctionTool>(result);
});

test('BaseTool.toAISDK returns AISDKToolResult', async () => {
  const result = await tool.toAISDK();
  assertType<AISDKToolResult>(result);
});

test('BaseTool.toAISDK result has typed properties', async () => {
  const result = await tool.toAISDK();
  const toolDef = result.test_tool;

  // TODO: Remove ts-ignore once AISDKToolDefinition properly types description as required
  // @ts-ignore - description is optional in Tool but we always set it
  assertType<string>(toolDef.description);
  // TODO: Remove ts-ignore once AISDKToolDefinition properly types inputSchema.jsonSchema
  // @ts-ignore - inputSchema is FlexibleSchema which may not have jsonSchema
  assertType<{ jsonSchema: unknown }>(toolDef.inputSchema);
});

test('Tools.toOpenAI returns ChatCompletionFunctionTool[]', () => {
  const result = tools.toOpenAI();
  assertType<ChatCompletionFunctionTool[]>(result);
});

test('Tools.toAISDK returns AISDKToolResult', async () => {
  const result = await tools.toAISDK();
  assertType<AISDKToolResult>(result);
});
