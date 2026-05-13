/**
 * Defender configuration patterns.
 *
 * Sections 1–7 are construction-only: the four configuration modes,
 * the `defenderMode` getter, the once-per-process override warning,
 * and the runtime validation error. No API key required.
 *
 * Section 8 makes a live RPC call so you can see the defender
 * annotations the backend returns. It's gated on `STACKONE_API_KEY`
 * and skips with a friendly message if you don't have one set.
 *
 * Run with:
 *   pnpm run:example examples/defender-config.ts
 *
 * Or override the connector and tool for section 8:
 *   TOOL_NAME=calendly_get_current_user TOOL_BODY_JSON='{}' pnpm run:example examples/defender-config.ts
 *   TOOL_NAME=hibob_list_employees TOOL_BODY_JSON='{"page_size": 5}' pnpm run:example examples/defender-config.ts
 *
 * Live section env vars:
 *   STACKONE_API_KEY      (required to run section 8; read from .env via run:example)
 *   STACKONE_ACCOUNT_ID   (required for tool execution unless your key has a default account)
 *   TOOL_NAME             (defaults to gmail_list_messages)
 *   TOOL_BODY_JSON        (JSON body, defaults to `{}`)
 */

import process from 'node:process';
import type { JsonObject } from '@stackone/ai';
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

// --- 8. Live tool call — inspect defender annotations in the real response ---
const liveCall = async (): Promise<void> => {
	heading('8. Live tool call — inspect defender annotations');

	if (!process.env.STACKONE_API_KEY) {
		console.log('  Skipping — set STACKONE_API_KEY to run this section.');
		console.log('  Optional: STACKONE_ACCOUNT_ID, TOOL_NAME, TOOL_BODY_JSON.');
		return;
	}

	const toolName = process.env.TOOL_NAME ?? 'gmail_list_messages';
	let body: JsonObject;
	try {
		body = JSON.parse(process.env.TOOL_BODY_JSON ?? '{}') as JsonObject;
	} catch (err) {
		console.log(`  Invalid TOOL_BODY_JSON: ${(err as Error).message}`);
		return;
	}

	const toolset = new StackOneToolSet({
		defender: { ...DEFAULT_DEFENDER_CONFIG, blockHighRisk: false },
	});

	console.log(`  Fetching tools and calling ${toolName}...`);
	const tools = await toolset.fetchTools();
	const tool = tools.toArray().find((t) => t.name === toolName);
	if (!tool) {
		console.log(`  Tool "${toolName}" not in this account.`);
		return;
	}

	const result = await tool.execute({ body });

	// The backend surfaces defender annotations alongside the tool data:
	//
	//   {
	//     data: <tool result>,
	//     defenderMetadata: {
	//       applied: boolean,                                    // false if defender ran but did nothing
	//       result: {
	//         allowed: boolean,                                  // false → backend blocked (with blockHighRisk: true)
	//         riskLevel: 'low' | 'medium' | 'high' | 'critical',
	//         fieldsSanitized: string[],
	//         patternsByField: Record<string, string[]>,
	//         detections: unknown[],
	//         tier2SkipReason?: string,                          // only when Tier 2 didn't run (e.g. no strings)
	//         latencyMs: number,
	//       }
	//     }
	//   }
	const metadata = (result as { defenderMetadata?: unknown }).defenderMetadata;
	if (metadata) {
		console.log('  defenderMetadata:', JSON.stringify(metadata, null, 2));
	} else {
		console.log('  (no defenderMetadata in response — defender may not have run)');
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
await liveCall();

console.log('\nDone — defender patterns demonstrated.');
