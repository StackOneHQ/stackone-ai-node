import { mcpHandlers } from './handlers.mcp';
import { openaiHandlers } from './handlers.openai';
import { stackoneAccountsHandlers } from './handlers.stackone-accounts';
import { stackoneRpcHandlers } from './handlers.stackone-rpc';

export const handlers = [
	...openaiHandlers,
	...stackoneAccountsHandlers,
	...stackoneRpcHandlers,
	...mcpHandlers,
];
