/**
 * The SDK's single diagnostic channel.
 *
 * Everything the SDK wants a developer to notice without failing the call — a dropped
 * header, a skipped account, a clashing tool name — goes through here, so a host can
 * silence or redirect it by stubbing `console.warn` in one place.
 */
export function warn(message: string): void {
	// oxlint-disable-next-line no-console -- the one intentional console sink in the SDK
	console.warn(`[@stackone/ai] ${message}`);
}
