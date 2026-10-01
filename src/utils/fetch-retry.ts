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

const defaultTiming: RetryTiming = { sleep, random: Math.random };

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
	const date = Date.parse(value);
	return Number.isNaN(date) ? undefined : Math.max(0, date - Date.now());
}

/**
 * `fetch`, retried on HTTP 429.
 *
 * A 429 means the server refused before doing anything, so even a `tools/call` is safe to send
 * again. Each retry waits for the response's `Retry-After` (capped at 30s), or else 1s, 2s, 4s
 * with jitter. Every other status, and the last 429, is handed back as it came: the caller turns
 * it into a `StackOneAPIError` with the server's body. The waits run inside the caller's signal,
 * so a timeout still bounds the whole exchange.
 */
export async function fetchWithRetry(
	input: string | URL,
	init?: RequestInit,
	timing: RetryTiming = defaultTiming,
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
