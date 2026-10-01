/**
 * Run `work` over `items` with at most `limit` in flight, settling every one.
 *
 * Results come back in input order whatever order they complete in, so callers that merge them
 * stay deterministic.
 *
 * A failure that `isFatal` accepts is not settled: it rejects the whole run as soon as it is
 * seen, and no further item is started. Work already in flight finishes in the background.
 */
export async function settleWithConcurrency<T, R>(
	items: readonly T[],
	limit: number,
	work: (item: T) => Promise<R>,
	isFatal: (reason: unknown) => boolean = () => false,
): Promise<PromiseSettledResult<R>[]> {
	const results: PromiseSettledResult<R>[] = Array.from({ length: items.length });
	let next = 0;
	let stopped = false;
	const worker = async (): Promise<void> => {
		while (!stopped && next < items.length) {
			const index = next++;
			try {
				results[index] = { status: 'fulfilled', value: await work(items[index] as T) };
			} catch (reason) {
				if (isFatal(reason)) {
					stopped = true;
					throw reason;
				}
				results[index] = { status: 'rejected', reason };
			}
		}
	};
	await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
	return results;
}
