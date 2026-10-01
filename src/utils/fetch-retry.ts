import {
	RATE_LIMIT_BASE_DELAY_MS,
	RATE_LIMIT_MAX_DELAY_MS,
	RATE_LIMIT_MAX_RETRIES,
} from '../consts';
import { warn } from './logger';

interface RetryTiming {
	/** Wait `ms` milliseconds, rejecting with the signal's reason if it aborts first. */
	sleep: (ms: number, signal?: AbortSignal | null) => Promise<void>;
	/** A number in [0, 1), as `Math.random` returns. Drives the backoff jitter. */
	random: () => number;
	/** The current time in milliseconds, on the clock a `deadline` is measured on. */
	now: () => number;
}

interface RetryOptions {
	/**
	 * When the caller's timeout expires, as a {@link RetryTiming.now} time. A retry whose wait
	 * would not end before it is not attempted: the 429 is returned instead.
	 */
	deadline?: number;
	timing?: RetryTiming;
}

const sleep = (ms: number, signal?: AbortSignal | null): Promise<void> =>
	new Promise((resolve, reject) => {
		if (signal?.aborted) {
			reject(signal.reason);
			return;
		}
		const onAbort = (): void => {
			clearTimeout(timer);
			reject(signal?.reason);
		};
		const timer = setTimeout(() => {
			signal?.removeEventListener('abort', onAbort);
			resolve();
		}, ms);
		signal?.addEventListener('abort', onAbort, { once: true });
	});

/**
 * The timing every retry uses unless given its own. Shared and mutable so tests can replace
 * the clock and the waits of a whole toolset call, deadline included.
 */
export const retryTiming: RetryTiming = {
	sleep,
	random: () => Math.random(),
	now: () => performance.now(),
};

/**
 * How long the server asked us to wait, in milliseconds: `Retry-After` as delta-seconds or an
 * HTTP-date. Undefined when the header is absent or unreadable, so the caller backs off instead.
 */
function retryAfterMs(header: string | null): number | undefined {
	const value = header?.trim();
	if (!value) {
		return undefined;
	}
	if (/^\d+$/.test(value)) {
		return Number(value) * 1000;
	}
	// All three HTTP-date forms start with a weekday ("Sun,", "Sunday,", "Sun "). Date.parse
	// alone reads "1.5" or "March 1, 2027" as dates, so anything else falls back to the
	// backoff, as in Python.
	if (!/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*[, ]/.test(value)) {
		return undefined;
	}
	const date = Date.parse(value);
	return Number.isNaN(date) ? undefined : Math.max(0, date - Date.now());
}

/**
 * `fetch`, retried on HTTP 429.
 *
 * A 429 means the server refused before doing anything, so even a `tools/call` is safe to send
 * again. Each retry waits for the response's `Retry-After` (capped at 30s), or else 1s, 2s, 4s
 * with jitter. Every other status, and the last 429, is handed back as it came: the caller turns
 * it into a `StackOneAPIError` with the server's body.
 *
 * A wait that would not end before `deadline` is not started: the 429 is handed back at once.
 * Waiting anyway would only let the caller's timeout fire, turning a rate limit — which fails a
 * multi-account call — into a timeout, which skips one account and returns a partial result.
 */
export async function fetchWithRetry(
	input: string | URL,
	init?: RequestInit,
	{ deadline, timing = retryTiming }: RetryOptions = {},
): Promise<Response> {
	for (let retry = 1; ; retry++) {
		const response = await fetch(input, init);
		if (response.status !== 429 || retry > RATE_LIMIT_MAX_RETRIES) {
			return response;
		}
		const requested = retryAfterMs(response.headers.get('retry-after'));
		const delay =
			requested === undefined
				? RATE_LIMIT_BASE_DELAY_MS * 2 ** (retry - 1) * (0.5 + timing.random() * 0.5)
				: Math.min(requested, RATE_LIMIT_MAX_DELAY_MS);
		if (deadline !== undefined && timing.now() + delay >= deadline) {
			return response;
		}
		// Discarded unread: only the final 429's body is reported. Not awaited, since a cancel can
		// wait on a producer that never settles (MSW's, for one), and the retry need not wait.
		void response.body?.cancel().catch(() => undefined);
		warn(
			`Rate limited (429) by ${init?.method ?? 'GET'} ${String(input)}; retrying in ${Math.round(delay)}ms (attempt ${retry + 1} of ${RATE_LIMIT_MAX_RETRIES + 1})`,
		);
		if (delay > 0) {
			await timing.sleep(delay, init?.signal);
		}
	}
}
