/**
 * Benchmark: measure SDK search latency with caching.
 *
 * Runs fetchTools, local (BM25+TF-IDF) search, and semantic search N times,
 * reports cold vs warm average latency and the speedup from caching.
 *
 * Prerequisites:
 *   - STACKONE_API_KEY environment variable
 *   - STACKONE_ACCOUNT_ID environment variable
 *
 * Run with:
 *   STACKONE_API_KEY=xxx STACKONE_ACCOUNT_ID=xxx npx tsx examples/benchmark-search.ts
 *   STACKONE_API_KEY=xxx STACKONE_ACCOUNT_ID=xxx npx tsx examples/benchmark-search.ts --iterations 50
 */

import process from 'node:process';
import { StackOneToolSet } from '@stackone/ai';

const QUERIES = ['list events', 'cancel a meeting', 'send a message', 'get current user', 'list employees'];

function parseArgs(): number {
	const idx = process.argv.indexOf('--iterations');
	const idxShort = process.argv.indexOf('-n');
	const pos = idx !== -1 ? idx : idxShort;
	if (pos !== -1 && process.argv[pos + 1]) {
		return Number.parseInt(process.argv[pos + 1], 10);
	}
	return 100;
}

async function bench(fn: () => Promise<void>, n: number): Promise<{ cold: number; warmAvg: number }> {
	const times: number[] = [];
	for (let i = 0; i < n; i++) {
		const start = performance.now();
		await fn();
		times.push(performance.now() - start);
	}
	const cold = times[0];
	const warmTimes = times.slice(1);
	const warmAvg = warmTimes.length > 0 ? warmTimes.reduce((a, b) => a + b, 0) / warmTimes.length : cold;
	return { cold, warmAvg };
}

function fmtMs(ms: number): string {
	return `${ms.toFixed(1)}ms`.padStart(10);
}

async function main(): Promise<void> {
	const iterations = parseArgs();

	const apiKey = process.env.STACKONE_API_KEY;
	const accountId = process.env.STACKONE_ACCOUNT_ID;

	if (!apiKey) {
		console.error('Set STACKONE_API_KEY to run this benchmark.');
		process.exit(1);
	}
	if (!accountId) {
		console.error('Set STACKONE_ACCOUNT_ID to run this benchmark.');
		process.exit(1);
	}

	console.log(`Benchmarking with account ${accountId.slice(0, 8)}..., ${iterations} iterations each\n`);

	const ts = new StackOneToolSet({
		apiKey,
		accountId,
		search: { method: 'auto', topK: 5 },
	});

	const results: Array<{ name: string; cold: number; warmAvg: number; speedup: number }> = [];
	let queryIdx = 0;
	const nextQuery = (): string => QUERIES[queryIdx++ % QUERIES.length];

	// --- 1. fetchTools ---
	console.log(`[1/3] fetchTools x${iterations} ...`);
	ts.clearCatalogCache();
	const fetch = await bench(() => ts.fetchTools(), iterations);
	const fetchSpeedup = fetch.cold / fetch.warmAvg;
	results.push({ name: 'fetchTools', ...fetch, speedup: fetchSpeedup });
	console.log(`       cold=${fmtMs(fetch.cold)}  warm_avg=${fmtMs(fetch.warmAvg)}  speedup=${fetchSpeedup.toFixed(0)}x`);

	// --- 2. local search (BM25 + TF-IDF) ---
	console.log(`[2/3] searchTools (local) x${iterations} ...`);
	ts.clearCatalogCache();
	queryIdx = 0;
	const local = await bench(() => ts.searchTools(nextQuery(), { search: 'local' }), iterations);
	const localSpeedup = local.cold / local.warmAvg;
	results.push({ name: 'search (local/BM25)', ...local, speedup: localSpeedup });
	console.log(`       cold=${fmtMs(local.cold)}  warm_avg=${fmtMs(local.warmAvg)}  speedup=${localSpeedup.toFixed(0)}x`);

	// --- 3. semantic search (auto) ---
	console.log(`[3/3] searchTools (semantic/auto) x${iterations} ...`);
	ts.clearCatalogCache();
	queryIdx = 0;
	const semantic = await bench(() => ts.searchTools(nextQuery(), { search: 'auto' }), iterations);
	const semanticSpeedup = semantic.cold / semantic.warmAvg;
	results.push({ name: 'search (semantic)', ...semantic, speedup: semanticSpeedup });
	console.log(`       cold=${fmtMs(semantic.cold)}  warm_avg=${fmtMs(semantic.warmAvg)}  speedup=${semanticSpeedup.toFixed(0)}x`);

	// --- Summary ---
	console.log('\n' + '='.repeat(65));
	console.log(`${'Benchmark'.padEnd(22)} ${'Cold'.padStart(10)} ${'Warm (avg)'.padStart(10)} ${'Speedup'.padStart(10)}`);
	console.log('-'.repeat(65));
	for (const r of results) {
		console.log(`${r.name.padEnd(22)} ${fmtMs(r.cold)} ${fmtMs(r.warmAvg)} ${`${r.speedup.toFixed(0)}x`.padStart(10)}`);
	}
	console.log('='.repeat(65));
	console.log(`\nWarm = average of ${iterations - 1} calls after the first (cold) call.`);
	console.log('Speedup = cold / warm_avg — shows the benefit of caching.\n');
}

main();
