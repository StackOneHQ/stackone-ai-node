import { http, HttpResponse, type JsonBodyType } from 'msw';
import { TEST_BASE_URL } from '../../mocks/constants';
import { server } from '../../mocks/node';
import { fetchWithRetry, retryAfterMs } from './fetch-retry';

const url = `${TEST_BASE_URL}/limited`;

/** Answer each request with the next response, repeating the last. Returns the request count. */
const respondWith = (...responses: Array<() => Response>) => {
	const seen = { requests: 0 };
	server.use(
		http.all(url, () => {
			const respond = responses[Math.min(seen.requests, responses.length - 1)];
			seen.requests++;
			return respond?.();
		}),
	);
	return seen;
};

const limited =
	(headers: Record<string, string> = {}, body: JsonBodyType = { message: 'slow down' }) =>
	() =>
		HttpResponse.json(body, { status: 429, headers });
const ok = () => HttpResponse.json({ ok: true });

/** Timing that records each requested wait instead of waiting, advancing a fake clock by it. */
const recordedTiming = (random = () => 0.5) => {
	const delays: number[] = [];
	const clock = { now: 0 };
	return {
		delays,
		timing: {
			sleep: async (ms: number) => {
				delays.push(ms);
				clock.now += ms;
			},
			random,
			now: () => clock.now,
		},
	};
};

let warnSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
	warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
	vi.restoreAllMocks();
});

describe('fetchWithRetry', () => {
	it('retries a 429 and returns the success', async () => {
		const seen = respondWith(limited({ 'Retry-After': '2' }), ok);
		const { delays, timing } = recordedTiming();

		const response = await fetchWithRetry(url, { method: 'POST', body: '{}' }, { timing });

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ ok: true });
		expect(seen.requests).toBe(2);
		expect(delays).toEqual([2000]);
		expect(warnSpy.mock.calls.map(([message]: unknown[]) => message)).toEqual([
			`[@stackone/ai] POST ${url} was rate limited (429) on attempt 1 of 4; retrying in 2s`,
		]);
	});

	it('gives up after 4 attempts, returning the last 429 with its body', async () => {
		const seen = respondWith(
			limited({}, { message: 'first' }),
			limited({}, { message: 'second' }),
			limited({}, { message: 'third' }),
			limited({}, { message: 'last' }),
			ok,
		);
		const { delays, timing } = recordedTiming();

		const response = await fetchWithRetry(url, undefined, { timing });

		expect(response.status).toBe(429);
		expect(await response.json()).toEqual({ message: 'last' });
		expect(seen.requests).toBe(4);
		expect(delays).toHaveLength(3);
		expect(warnSpy).toHaveBeenCalledTimes(3);
	});

	it.each([400, 401, 412, 500, 503])('does not retry a %i', async (status) => {
		const seen = respondWith(
			() => HttpResponse.json({}, { status, headers: { 'Retry-After': '1' } }),
			ok,
		);
		const { delays, timing } = recordedTiming();

		expect((await fetchWithRetry(url, undefined, { timing })).status).toBe(status);
		expect(seen.requests).toBe(1);
		expect(delays).toEqual([]);
	});

	describe('Retry-After', () => {
		it('waits the delta-seconds given', async () => {
			respondWith(limited({ 'Retry-After': '7' }), ok);
			const { delays, timing } = recordedTiming();

			await fetchWithRetry(url, undefined, { timing });

			expect(delays).toEqual([7000]);
		});

		it('waits until the HTTP-date given', async () => {
			// HTTP-dates have whole-second precision, so the wait lands within a second below 10s.
			const at = new Date(Date.now() + 10_000).toUTCString();
			respondWith(limited({ 'Retry-After': at }), ok);
			const { delays, timing } = recordedTiming();

			await fetchWithRetry(url, undefined, { timing });

			expect(delays).toHaveLength(1);
			expect(delays[0]).toBeGreaterThan(8_000);
			expect(delays[0]).toBeLessThanOrEqual(10_000);
		});

		it('retries at once for an HTTP-date in the past', async () => {
			respondWith(limited({ 'Retry-After': new Date(0).toUTCString() }), ok);
			const { delays, timing } = recordedTiming();

			expect((await fetchWithRetry(url, undefined, { timing })).status).toBe(200);
			expect(delays).toEqual([]);
		});

		it.each([
			['delta-seconds', '120'],
			['an HTTP-date', new Date(Date.now() + 3_600_000).toUTCString()],
		])('caps %s at 30s', async (_kind, value) => {
			respondWith(limited({ 'Retry-After': value }), ok);
			const { delays, timing } = recordedTiming();

			await fetchWithRetry(url, undefined, { timing });

			expect(delays).toEqual([30_000]);
		});

		it('retries immediately on 0', async () => {
			const seen = respondWith(limited({ 'Retry-After': '0' }), ok);
			const { delays, timing } = recordedTiming();

			expect((await fetchWithRetry(url, undefined, { timing })).status).toBe(200);
			expect(seen.requests).toBe(2);
			expect(delays).toEqual([]);
			expect(String(warnSpy.mock.calls[0]?.[0])).toBe(
				`[@stackone/ai] GET ${url} was rate limited (429) on attempt 1 of 4; retrying in 0s`,
			);
		});

		it.each(['soon', 'March 1, 2027'])(
			'backs off as if absent when unreadable (%s)',
			async (value) => {
				respondWith(limited({ 'Retry-After': value }), ok);
				const { delays, timing } = recordedTiming(() => 0);

				await fetchWithRetry(url, undefined, { timing });

				expect(delays).toEqual([500]);
			},
		);
	});

	// The shared vectors (src/vectors.test.ts) grade the forms, years and refusals; these are
	// the calendar edges they leave out.
	describe('retryAfterMs', () => {
		const now = Date.parse('2026-10-01T12:00:00Z');

		it('reads a leap second as the start of the next minute', () => {
			expect(retryAfterMs('Thu, 01 Oct 2026 12:00:60 GMT', now)).toBe(60_000);
		});

		it('reads 29 February in a leap year', () => {
			expect(retryAfterMs('Tue, 29 Feb 2028 00:00:00 GMT', now)).toBe(
				Date.parse('2028-02-29T00:00:00Z') - now,
			);
		});

		it.each([
			['29 February in a common year', 'Sun, 29 Feb 2026 12:00:00 GMT'],
			['year 0', 'Sat, 01 Jan 0000 12:00:00 GMT'],
			['second 61', 'Thu, 01 Oct 2026 12:00:61 GMT'],
		])('refuses %s', (_problem, value) => {
			expect(retryAfterMs(value, now)).toBeUndefined();
		});
	});

	describe('without Retry-After', () => {
		it('backs off 1s, 2s, 4s, scaled by jitter of at least 0.5', async () => {
			respondWith(limited());
			const { delays, timing } = recordedTiming(() => 0);

			await fetchWithRetry(url, undefined, { timing });

			expect(delays).toEqual([500, 1000, 2000]);
		});

		it('backs off 1s, 2s, 4s, scaled by jitter below 1.0', async () => {
			respondWith(limited());
			const { delays, timing } = recordedTiming(() => 0.999_999);

			await fetchWithRetry(url, undefined, { timing });

			expect(delays).toHaveLength(3);
			[1000, 2000, 4000].forEach((ceiling, index) => {
				expect(delays[index]).toBeGreaterThan(ceiling * 0.99);
				expect(delays[index]).toBeLessThan(ceiling);
			});
		});

		it('keeps every jittered delay within [0.5, 1.0) of the base', async () => {
			respondWith(limited());
			const { delays, timing } = recordedTiming(Math.random);

			await fetchWithRetry(url, undefined, { timing });

			[1000, 2000, 4000].forEach((base, index) => {
				expect(delays[index]).toBeGreaterThanOrEqual(base * 0.5);
				expect(delays[index]).toBeLessThan(base);
			});
		});
	});

	describe('with a deadline', () => {
		it('returns the 429 at once when Retry-After would outlast the deadline', async () => {
			const seen = respondWith(limited({ 'Retry-After': '3' }, { message: 'too long' }), ok);
			const { delays, timing } = recordedTiming();

			const response = await fetchWithRetry(url, undefined, { deadline: 1_000, timing });

			expect(response.status).toBe(429);
			expect(await response.json()).toEqual({ message: 'too long' });
			expect(seen.requests).toBe(1);
			expect(delays).toEqual([]);
			expect(warnSpy.mock.calls.map(([message]: unknown[]) => message)).toEqual([
				`[@stackone/ai] GET ${url} was rate limited (429) on attempt 1 of 4; not retrying, because waiting 3s would pass the deadline`,
			]);
		});

		it('counts every earlier wait against the deadline', async () => {
			const seen = respondWith(limited({ 'Retry-After': '2' }));
			const { delays, timing } = recordedTiming();

			// Waiting 2s ends at 2s, inside 3s; the next 2s wait would end at 4s, so it is not started.
			const response = await fetchWithRetry(url, undefined, { deadline: 3_000, timing });

			expect(response.status).toBe(429);
			expect(seen.requests).toBe(2);
			expect(delays).toEqual([2_000]);
		});

		it('applies to the jittered backoff too', async () => {
			const seen = respondWith(limited());
			const { delays, timing } = recordedTiming(() => 0);

			// 500ms, then 1000ms fit in 2s; the 2000ms after them would end at 3.5s.
			const response = await fetchWithRetry(url, undefined, { deadline: 2_000, timing });

			expect(response.status).toBe(429);
			expect(seen.requests).toBe(3);
			expect(delays).toEqual([500, 1_000]);
		});

		it('does not retry a wait that would end exactly at the deadline', async () => {
			const seen = respondWith(limited({ 'Retry-After': '1' }), ok);
			const { delays, timing } = recordedTiming();

			const response = await fetchWithRetry(url, undefined, { deadline: 1_000, timing });

			expect(response.status).toBe(429);
			expect(seen.requests).toBe(1);
			expect(delays).toEqual([]);
		});

		it('retries a wait that ends before the deadline', async () => {
			const seen = respondWith(limited({ 'Retry-After': '1' }), ok);
			const { delays, timing } = recordedTiming();

			const response = await fetchWithRetry(url, undefined, { deadline: 1_001, timing });

			expect(response.status).toBe(200);
			expect(seen.requests).toBe(2);
			expect(delays).toEqual([1_000]);
		});
	});

	it('waits for real by default, and gives up the wait when the signal aborts', async () => {
		const seen = respondWith(limited({ 'Retry-After': '30' }), ok);
		const controller = new AbortController();
		const reason = new Error('deadline');
		setTimeout(() => controller.abort(reason), 20);

		const started = performance.now();
		await expect(fetchWithRetry(url, { signal: controller.signal })).rejects.toBe(reason);

		expect(performance.now() - started).toBeLessThan(5_000);
		expect(seen.requests).toBe(1);
	});
});
