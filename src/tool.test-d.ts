import type { generateText } from 'ai';
import type { ChatCompletionFunctionTool } from 'openai/resources/chat/completions';
import { BaseTool, Tools } from './tool';
import type { AISDKToolResult } from './types';

type GenerateTextTools = NonNullable<Parameters<typeof generateText>[0]['tools']>;

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
	},
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

// The point of the widened `ai` peer range is that this assignment holds on
// every supported major. v7 reshaped `Tool` into a union, so a regression here
// would break the primary consumer path rather than just an internal type.
test('toAISDK result is accepted as generateText tools', async () => {
	const fromTool = await tool.toAISDK();
	const fromTools = await tools.toAISDK();

	assertType<GenerateTextTools>(fromTool);
	assertType<GenerateTextTools>(fromTools);
});
