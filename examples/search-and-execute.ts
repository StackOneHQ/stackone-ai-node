/**
 * Find an action in natural language and run it, without loading a tool catalog.
 *
 * This is the recommended way to use the SDK: search() asks every linked connector and returns
 * ranked actions, so a catalog of hundreds of tools never has to fit in a model's context.
 *
 * Prerequisites: STACKONE_API_KEY and at least one active linked account. No account id is
 * needed — the toolset discovers the ones your key can reach.
 *
 * Run with:
 *   STACKONE_API_KEY=xxx npx tsx examples/search-and-execute.ts
 *
 * Expected output: your linked accounts, the ranked actions matching the query, the input
 * schema of the best one, and the result of executing it.
 */

import process from 'node:process';
import { StackOneError, StackOneToolSet, ToolSetError } from '@stackone/ai';

if (!process.env.STACKONE_API_KEY) {
	console.error('STACKONE_API_KEY environment variable is required');
	process.exit(1);
}

const searchAndExecute = async (): Promise<void> => {
	const toolset = new StackOneToolSet();

	for (const account of await toolset.fetchAccounts()) {
		console.log(`${account.id}  ${account.provider ?? '?'}  ${account.status ?? '?'}`);
	}

	const actions = await toolset.search('list recent comments', { topK: 3 });
	const [best] = actions;
	if (!best) {
		console.error('No actions matched. Try a different query, or link an account.');
		process.exit(1);
	}

	console.log('\nRanked matches:');
	for (const action of actions) {
		const score = typeof action.similarity_score === 'number' ? action.similarity_score : 0;
		console.log(`  ${score.toFixed(3)}  ${action.action_id}`);
	}

	// input_schema is how you find out what an action accepts. Build the call from it and from
	// example_request: arguments that do not match are dropped by the server without an error,
	// so a guessed parameter looks like it worked.
	console.log(`\ninput_schema for ${best.action_id}:`);
	console.log(JSON.stringify(best.input_schema ?? {}, null, 2).slice(0, 600));

	// Passing the hit's session_id links this call to the search that found it.
	const result = await toolset.execute(
		best.action_id,
		{ query: { limit: 2 } },
		{
			sessionId: best.session_id,
		},
	);
	console.log(`\nresult: ${JSON.stringify(result).slice(0, 300)}...`);

	// When feedback is enabled for your project, say how it went.
	try {
		await toolset.submitFeedback({
			rating: 'positive',
			toolNames: [best.action_id],
			category: 'search',
			sessionId: best.session_id,
		});
		console.log('\nFeedback recorded.');
	} catch (error) {
		if (!(error instanceof ToolSetError)) {
			throw error;
		}
		console.log(`\nFeedback skipped: ${error.message}`);
	}
};

try {
	await searchAndExecute();
} catch (error) {
	if (error instanceof ToolSetError) {
		console.error(`Could not load tools from StackOne: ${error.message}`);
		process.exit(1);
	}
	if (error instanceof StackOneError) {
		console.error(`StackOne API error: ${error.message}`);
		process.exit(1);
	}
	throw error;
}
