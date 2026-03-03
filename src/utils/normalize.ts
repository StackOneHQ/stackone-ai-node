/**
 * Action name normalization utilities.
 *
 * The semantic search API returns versioned action names like:
 *   'calendly_1.0.0_calendly_create_scheduling_link_global'
 *
 * MCP tools use simplified names:
 *   'calendly_create_scheduling_link'
 *
 * This module bridges the two formats.
 */

const VERSIONED_ACTION_RE = /^[a-z][a-z0-9]*_\d+(?:\.\d+)+_(.+)_global$/;

/**
 * Convert semantic search API action name to MCP tool name.
 *
 * @param actionName - The raw action name from the API
 * @returns The normalized MCP-compatible tool name
 *
 * @example
 * ```typescript
 * normalizeActionName('calendly_1.0.0_calendly_create_scheduling_link_global');
 * // => 'calendly_create_scheduling_link'
 *
 * normalizeActionName('bamboohr_create_employee');
 * // => 'bamboohr_create_employee' (unchanged)
 * ```
 */
export function normalizeActionName(actionName: string): string {
	const match = VERSIONED_ACTION_RE.exec(actionName);
	return match ? match[1] : actionName;
}
