import { version } from '../package.json';

/**
 * Sent as the User-Agent on every request, versioned so each request is attributable to an
 * exact SDK release.
 */
export const USER_AGENT = `stackone-ai-node/${version}`;

/**
 * Default base URL for StackOne API
 */
export const DEFAULT_BASE_URL = 'https://api.stackone.com';

/** Request timeout applied to every HTTP and MCP call unless the toolset is given one. */
export const DEFAULT_TIMEOUT_MS = 60_000;

/**
 * Param-style pinned on the /mcp tool-listing URL. The listed schema and the RPC envelope split
 * (see `splitEnvelopeParams`) must agree on it, so it is pinned rather than following the server
 * default — the server default is free to change without breaking the SDK.
 */
export const MCP_PARAM_STYLE = 'flat_prefixed';

/**
 * The one global tool the MCP endpoint serves, in every tool mode, when feedback is enabled for
 * the project. It is not a connector action; the server also accepts it on `/actions/rpc`, but
 * the SDK executes it only over MCP `tools/call`, where it is served.
 */
export const SUBMIT_FEEDBACK_TOOL_NAME = 'stackone_submit_feedback';

/** Upper bound on how many accounts' catalogs (or connectors' searches) run at once. */
export const MAX_CONCURRENCY = 10;

/** The `*_search_actions` meta tool's served schema caps `top_k` at 50. */
export const MAX_TOP_K = 50;
