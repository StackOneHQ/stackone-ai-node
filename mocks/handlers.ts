import { anthropicHandlers } from './handlers.anthropic';
import { mcpHandlers } from './handlers.mcp';
import { openaiHandlers } from './handlers.openai';
import { stackoneAccountsHandlers } from './handlers.stackone-accounts';

export const handlers = [
	...anthropicHandlers,
	...openaiHandlers,
	...stackoneAccountsHandlers,
	...mcpHandlers,
];
