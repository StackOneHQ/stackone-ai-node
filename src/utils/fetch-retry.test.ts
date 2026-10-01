import { http, HttpResponse, type JsonBodyType } from 'msw';
import { TEST_BASE_URL } from '../../mocks/constants';
import { server } from '../../mocks/node';
import { fetchWithRetry } from './fetch-retry';

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

/** Timing that records each requested wait instead of waiting. */
const recordedTiming = (random = () => 0.5) => {
	const delays: number[] = [];
	return {
		delays,
		timing: {
			sleep: async (ms: number) => {
				delays.push(ms);
			},
			random,
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

		const response = await fetchWithRetry(url, { method: 'POST', body: '{}' }, timing);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ ok: true });
		expect(seen.requests).toBe(2);
		expect(delays).toEqual([2000]);
		expect(warnSpy.mock.calls.map(([message]: unknown[]) => message)).toEqual([
			`[@stackone/ai] Rate limited (429) by POST ${url}; retrying in 2000ms (attempt 2 of 4)`,
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

		const response = await fetchWithRetry(url, undefined, timing);

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

		expect((await fetchWithRetry(url, undefined, timing)).status).toBe(status);
		expect(seen.requests).toBe(1);
		expect(delays).toEqual([]);
	});

	describe('Retry-After', () => {
		it('waits the delta-seconds given', async () => {
			respondWith(limited({ 'Retry-After': '7' }), ok);
			const { delays, timing } = recordedTiming();

			await fetchWithRetry(url, undefined, timing);

			expect(delays).toEqual([7000]);
		});

		it('waits until the HTTP-date given', async () => {
			// HTTP-dates have whole-second precision, so the wait lands within a second below 10s.
			const at = new Date(Date.now() + 10_000).toUTCString();
			respondWith(limited({ 'Retry-After': at }), ok);
			const { delays, timing } = recordedTiming();

			await fetchWithRetry(url, undefined, timing);

			expect(delays).toHaveLength(1);
			expect(delays[0]).toBeGreaterThan(8_000);
			expect(delays[0]).toBeLessThanOrEqual(10_000);
		});

		it('retries at once for an HTTP-date in the past', async () => {
			respondWith(limited({ 'Retry-After': new Date(0).toUTCString() }), ok);
			const { delays, timing } = recordedTiming();

			expect((await fetchWithRetry(url, undefined, timing)).status).toBe(200);
			expect(delays).toEqual([]);
		});

		it.each([
			['delta-seconds', '120'],
			['an HTTP-date', new Date(Date.now() + 3_600_000).toUTCString()],
		])('caps %s at 30s', async (_kind, value) => {
			respondWith(limited({ 'Retry-After': value }), ok);
			const { delays, timing } = recordedTiming();

			await fetchWithRetry(url, undefined, timing);

			expect(delays).toEqual([30_000]);
		});

		it('retries immediately on 0', async () => {
			const seen = respondWith(limited({ 'Retry-After': '0' }), ok);
			const { delays, timing } = recordedTiming();

			expect((await fetchWithRetry(url, undefined, timing)).status).toBe(200);
			expect(seen.requests).toBe(2);
			expect(delays).toEqual([]);
			expect(String(warnSpy.mock.calls[0]?.[0])).toContain('retrying in 0ms (attempt 2 of 4)');
		});

		it('backs off as if absent when unreadable', async () => {
			respondWith(limited({ 'Retry-After': 'soon' }), ok);
			const { delays, timing } = recordedTiming(() => 0);

			await fetchWithRetry(url, undefined, timing);

			expect(delays).toEqual([500]);
		});
	});

	describe('without Retry-After', () => {
		it('backs off 1s, 2s, 4s, scaled by jitter of at least 0.5', async () => {
			respondWith(limited());
			const { delays, timing } = recordedTiming(() => 0);

			await fetchWithRetry(url, undefined, timing);

			expect(delays).toEqual([500, 1000, 2000]);
		});

		it('backs off 1s, 2s, 4s, scaled by jitter below 1.0', async () => {
			respondWith(limited());
			const { delays, timing } = recordedTiming(() => 0.999_999);

			await fetchWithRetry(url, undefined, timing);

			expect(delays).toHaveLength(3);
			[1000, 2000, 4000].forEach((ceiling, index) => {
				expect(delays[index]).toBeGreaterThan(ceiling * 0.99);
				expect(delays[index]).toBeLessThan(ceiling);
			});
		});

		it('keeps every jittered delay within [0.5, 1.0) of the base', async () => {
			respondWith(limited());
			const { delays, timing } = recordedTiming(Math.random);

			await fetchWithRetry(url, undefined, timing);

			[1000, 2000, 4000].forEach((base, index) => {
				expect(delays[index]).toBeGreaterThanOrEqual(base * 0.5);
				expect(delays[index]).toBeLessThan(base);
			});
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
