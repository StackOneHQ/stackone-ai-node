import { exampleApiHandlers } from './handlers.example-api';
import { mcpHandlers } from './handlers.mcp';
import { openaiHandlers } from './handlers.openai';
import { stackoneAiHandlers } from './handlers.stackone-ai';
import { stackoneHrisHandlers } from './handlers.stackone-hris';
import { stackoneRpcHandlers } from './handlers.stackone-rpc';

export const handlers = [
	...openaiHandlers,
	...stackoneRpcHandlers,
	...stackoneHrisHandlers,
	...stackoneAiHandlers,
	...exampleApiHandlers,
	...mcpHandlers,
];
