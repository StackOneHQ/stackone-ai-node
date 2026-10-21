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
 * The one global tool the MCP endpoint serves, in every tool mode, when feedback is enabled for
 * the project. It is listed once however many accounts serve it.
 */
export const SUBMIT_FEEDBACK_TOOL_NAME = 'stackone_submit_feedback';

/**
 * The account-spanning search and execute tools the MCP endpoint serves under
 * `tool-mode=search_execute`, beside `stackone_list_accounts`. For one account the server serves
 * a pair named for its connector and account instead, which the SDK presents under these names.
 */
export const SEARCH_ACTIONS_TOOL_NAME = 'stackone_search_actions';
export const EXECUTE_ACTION_TOOL_NAME = 'stackone_execute_action';

/** The most accounts one `search_execute` request may name; the server refuses more with a 400. */
export const MAX_SCOPE_ACCOUNTS = 50;

/** Upper bound on how many accounts' catalogs are listed at once. */
export const MAX_CONCURRENCY = 10;

/** `stackone_search_actions`'s served schema caps `top_k` at 50. */
export const MAX_TOP_K = 50;

/** Retries after an HTTP 429, on top of the first attempt: four attempts in all. */
export const RATE_LIMIT_MAX_RETRIES = 3;

/** Backoff before retry 1 when the 429 carries no `Retry-After`; doubled for each retry after. */
export const RATE_LIMIT_BASE_DELAY_MS = 1_000;

/** Upper bound on a server-requested `Retry-After` wait. */
export const RATE_LIMIT_MAX_DELAY_MS = 30_000;

/**
 * How long an account that failed to list tools is left out of a cached catalog before a later
 * call tries it again. Short, so a re-linked account comes back quickly; long enough that one
 * broken account does not cost every call a fresh round trip, or a full timeout if it hangs.
 */
export const FAILED_ACCOUNT_RETRY_MS = 30_000;
