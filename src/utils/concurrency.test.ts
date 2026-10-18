import { settleWithConcurrency } from './concurrency';

describe('settleWithConcurrency', () => {
	it('settles every item, in input order', async () => {
		const settled = await settleWithConcurrency([1, 2, 3], 2, async (item) => {
			if (item === 2) {
				throw new Error('two');
			}
			return item * 10;
		});

		expect(settled).toEqual([
			{ status: 'fulfilled', value: 10 },
			{ status: 'rejected', reason: new Error('two') },
			{ status: 'fulfilled', value: 30 },
		]);
	});

	it('rejects on a fatal failure and starts no further item', async () => {
		const fatal = new Error('fatal');
		const started: number[] = [];

		const outcome = settleWithConcurrency(
			[1, 2, 3, 4],
			1,
			async (item) => {
				started.push(item);
				if (item === 2) {
					throw fatal;
				}
				return item;
			},
			(reason) => reason === fatal,
		);

		await expect(outcome).rejects.toBe(fatal);
		expect(started).toEqual([1, 2]);
	});
});
