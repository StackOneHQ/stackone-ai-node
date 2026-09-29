/**
 * Run `work` over `items` with at most `limit` in flight, settling every one.
 *
 * Results come back in input order whatever order they complete in, so callers that merge them
 * stay deterministic.
 */
export async function settleWithConcurrency<T, R>(
	items: readonly T[],
	limit: number,
	work: (item: T) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
	const results: PromiseSettledResult<R>[] = Array.from({ length: items.length });
	let next = 0;
	const worker = async (): Promise<void> => {
		while (next < items.length) {
			const index = next++;
			try {
				results[index] = { status: 'fulfilled', value: await work(items[index] as T) };
			} catch (reason) {
				results[index] = { status: 'rejected', reason };
			}
		}
	};
	await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
	return results;
}
