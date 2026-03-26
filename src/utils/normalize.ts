/**
 * Action name normalization utilities.
 *
 * The semantic search API returns composite IDs like:
 *   'slack_1.0.0_send_message_global'
 *
 * MCP tools use names like:
 *   'slack_send_message'
 *
 * This module bridges the two formats by extracting the connector
 * and action parts, then combining them.
 */

const VERSION_RE = /^\d+(?:\.\d+)+$/;

/**
 * Convert semantic search API composite ID to MCP tool name.
 *
 * Composite ID format: {connector}_{version}_{actionId}_{projectId}
 *
 * @param compositeId - The composite ID from the API
 * @returns The normalized MCP-compatible tool name
 *
 * @example
 * ```typescript
 * normalizeActionName('slack_1.0.0_send_message_global');
 * // => 'slack_send_message'
 *
 * normalizeActionName('calendly_1.0.0_calendly_create_scheduling_link_global');
 * // => 'calendly_create_scheduling_link' (no duplicate prefix)
 *
 * normalizeActionName('bamboohr_create_employee');
 * // => 'bamboohr_create_employee' (unchanged, no version)
 * ```
 */
export function normalizeActionName(compositeId: string): string {
	const parts = compositeId.split('_');

	// Find the version segment (e.g. "1.0.0")
	let versionIdx = -1;
	for (let i = 0; i < parts.length; i++) {
		if (VERSION_RE.test(parts[i])) {
			versionIdx = i;
			break;
		}
	}

	if (versionIdx < 1) return compositeId;

	const connector = parts.slice(0, versionIdx).join('_');

	// Everything after version, excluding the last segment (projectId)
	const afterVersion = parts.slice(versionIdx + 1);
	if (afterVersion.length < 2) return compositeId;

	const actionParts = afterVersion.slice(0, -1); // drop projectId (last segment)
	const actionId = actionParts.join('_');

	// If actionId already starts with connector prefix, don't duplicate
	if (actionId.startsWith(`${connector}_`)) {
		return actionId;
	}
	return `${connector}_${actionId}`;
}
