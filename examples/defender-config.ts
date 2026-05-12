/**
 * Defender configuration patterns.
 *
 * Shows the four ways to configure prompt-injection detection on a
 * `StackOneToolSet`, the `defenderMode` getter for inspecting resolved
 * behavior, and the once-per-process warning the SDK emits when it
 * overrides the project dashboard setting.
 *
 * Construction-only — no API key required, no network calls.
 *
 * Run with:
 *   npx tsx examples/defender-config.ts
 */

import { DEFAULT_DEFENDER_CONFIG, StackOneToolSet, ToolSetConfigError } from '@stackone/ai';

const heading = (label: string): void => {
	console.log(`\n=== ${label} ===`);
};

// --- 1. Default — defer to project dashboard ---
const defaultMode = (): void => {
	heading('1. Default (omit defender) — defer to dashboard');
	const toolset = new StackOneToolSet({ apiKey: 'demo-key' });
	console.log(`  defenderMode: ${toolset.defenderMode}`);
	console.log('  SDK adds no defender_config to the RPC payload.');
};

// --- 2. Explicit form of the default ---
const explicitProject = (): void => {
	heading('2. defender: { useProjectSettings: true } — same as default');
	const toolset = new StackOneToolSet({
		apiKey: 'demo-key',
		defender: { useProjectSettings: true },
	});
	console.log(`  defenderMode: ${toolset.defenderMode}`);
};

// --- 3. Force off — overrides dashboard ---
const disabled = (): void => {
	heading('3. defender: null — forcibly disabled (overrides dashboard)');
	const toolset = new StackOneToolSet({ apiKey: 'demo-key', defender: null });
	console.log(`  defenderMode: ${toolset.defenderMode}`);
	console.log('  SDK sends defender_config with all fields false.');
};

// --- 4. Spread defaults + tweak one field ---
const explicitOptIn = (): void => {
	heading('4. Spread DEFAULT_DEFENDER_CONFIG + override one field');
	const toolset = new StackOneToolSet({
		apiKey: 'demo-key',
		defender: { ...DEFAULT_DEFENDER_CONFIG, blockHighRisk: true },
	});
	console.log(`  defenderMode: ${toolset.defenderMode}`);
};

// --- 5. Repeat the same shape — dedupe should suppress the warning ---
const repeatedExplicit = (): void => {
	heading('5. Repeat the same explicit shape — warning suppressed');
	const toolset = new StackOneToolSet({
		apiKey: 'demo-key',
		defender: { ...DEFAULT_DEFENDER_CONFIG, blockHighRisk: true },
	});
	console.log(`  defenderMode: ${toolset.defenderMode}`);
};

// --- 6. Different explicit shape — fresh warning fires ---
const differentExplicit = (): void => {
	heading('6. Different explicit shape — fresh warning');
	const toolset = new StackOneToolSet({
		apiKey: 'demo-key',
		defender: {
			enabled: true,
			blockHighRisk: false,
			useTier1Classification: true,
			useTier2Classification: false,
		},
	});
	console.log(`  defenderMode: ${toolset.defenderMode}`);
};

// --- 7. Runtime validation ---
const invalidCombo = (): void => {
	heading('7. useProjectSettings: true + other fields → throws');
	try {
		new StackOneToolSet({
			apiKey: 'demo-key',
			// @ts-expect-error - intentionally testing invalid runtime input
			defender: { useProjectSettings: true, enabled: true },
		});
		console.log('  (no throw — unexpected!)');
	} catch (err) {
		if (err instanceof ToolSetConfigError) {
			console.log(`  caught ToolSetConfigError: ${err.message}`);
		} else {
			throw err;
		}
	}
};

// --- Run all sections ---
defaultMode();
explicitProject();
disabled();
explicitOptIn();
repeatedExplicit();
differentExplicit();
invalidCombo();

console.log('\nDone — defender patterns demonstrated.');
console.log('Expect three yellow warnings above: one for mode 3, one for mode 4, one for mode 6.');
console.log('Modes 1, 2, 5 stay silent (deferring to dashboard, or repeat of mode 4).');
