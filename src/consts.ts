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

/** Upper bound on how many accounts' catalogs (or connectors' searches) run at once. */
export const MAX_CONCURRENCY = 10;

/** The `*_search_actions` meta tool's served schema caps `top_k` at 50. */
export const MAX_TOP_K = 50;

/** Retries after an HTTP 429, on top of the first attempt: four attempts in all. */
export const RATE_LIMIT_MAX_RETRIES = 3;

/** Backoff before retry 1 when the 429 carries no `Retry-After`; doubled for each retry after. */
export const RATE_LIMIT_BASE_DELAY_MS = 1_000;

/** Upper bound on a server-requested `Retry-After` wait. */
export const RATE_LIMIT_MAX_DELAY_MS = 30_000;
