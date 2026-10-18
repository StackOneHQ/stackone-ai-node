import { mcpHandlers } from './handlers.mcp';
import { openaiHandlers } from './handlers.openai';
import { stackoneAccountsHandlers } from './handlers.stackone-accounts';

export const handlers = [...openaiHandlers, ...stackoneAccountsHandlers, ...mcpHandlers];
