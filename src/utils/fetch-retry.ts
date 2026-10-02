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

// The three HTTP-date forms of RFC 9110 §5.6.7, exactly: case-sensitive, single spaces, GMT only.
const WEEKDAY = '(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH = `(?<month>${MONTHS.join('|')})`;
const TIME = '(?<hour>\\d{2}):(?<minute>\\d{2}):(?<second>\\d{2})';

/** `Sun, 06 Nov 1994 08:49:37 GMT`: RFC 9110's preferred form. */
const IMF_FIXDATE = new RegExp(`^${WEEKDAY}, (?<day>\\d{2}) ${MONTH} (?<year>\\d{4}) ${TIME} GMT$`);
/** `Sunday, 06-Nov-94 08:49:37 GMT`: obsolete, with a two-digit year. */
const RFC850_DATE = new RegExp(
	`^(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (?<day>\\d{2})-${MONTH}-(?<year>\\d{2}) ${TIME} GMT$`,
);
/** `Sun Nov  6 08:49:37 1994`: obsolete, C's asctime(), always GMT. */
const ASCTIME_DATE = new RegExp(
	`^${WEEKDAY} ${MONTH} (?<day> \\d|\\d{2}) ${TIME} (?<year>\\d{4})$`,
);

const isLeapYear = (year: number): boolean =>
	(year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

const daysInMonth = (year: number, month: number): number =>
	[31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month] ?? 0;

/** A UTC time as milliseconds since the epoch. `setUTCFullYear`, as `Date.UTC` reads 0–99 as 19xx. */
function utcTime(
	year: number,
	month: number,
	day: number,
	h: number,
	m: number,
	s: number,
): number {
	const date = new Date(0);
	date.setUTCFullYear(year, month, day);
	date.setUTCHours(h, m, s, 0);
	return date.getTime();
}

/** `time` moved by whole years; 29 February lands on the 28th in a common year. */
function addYears(time: number, years: number): number {
	const date = new Date(time);
	const year = date.getUTCFullYear() + years;
	const day = Math.min(date.getUTCDate(), daysInMonth(year, date.getUTCMonth()));
	date.setUTCFullYear(year, date.getUTCMonth(), day);
	return date.getTime();
}

/**
 * Read an RFC 9110 HTTP-date as a time in milliseconds, or undefined if it is not one.
 *
 * Strict, unlike `Date.parse`, which reads a zone-less date in the host's local time, rolls
 * 30 February over to 2 March and accepts trailing text. All three forms are always GMT. The
 * weekday must be present but need not match the date, which is what the date means.
 */
function parseHttpDate(value: string, now: number): number | undefined {
	const rfc850 = RFC850_DATE.exec(value);
	const fields = (rfc850 ?? IMF_FIXDATE.exec(value) ?? ASCTIME_DATE.exec(value))?.groups;
	if (!fields) {
		return undefined;
	}
	const thisYear = new Date(now).getUTCFullYear();
	const year = Number(fields.year) + (rfc850 ? thisYear - (thisYear % 100) : 0);
	const month = MONTHS.indexOf(fields.month ?? '');
	const d = Number(fields.day);
	const h = Number(fields.hour);
	const m = Number(fields.minute);
	const s = Number(fields.second);
	// Second 60 is a leap second: the instant the next minute starts.
	if (year < 1 || d < 1 || d > daysInMonth(year, month) || h > 23 || m > 59 || s > 60) {
		return undefined;
	}
	let when = utcTime(year, month, d, h, m, s);
	if (rfc850) {
		// RFC 9110 §5.6.7: a two-digit year more than 50 years ahead is the most recent past year
		// with those digits.
		const horizon = addYears(now, 50);
		if (when > horizon) {
			when = addYears(when, -100);
		} else if (addYears(when, 100) <= horizon) {
			when = addYears(when, 100);
		}
	}
	return when;
}

/**
 * How long the server asked us to wait, in milliseconds: `Retry-After` as delta-seconds or an
 * HTTP-date, read against `now` (milliseconds since the epoch). Undefined when the header is
 * absent or unreadable, so the caller backs off instead. Not capped: the caller caps it.
 */
export function retryAfterMs(header: string | null, now: number = Date.now()): number | undefined {
	const value = header?.trim();
	if (!value) {
		return undefined;
	}
	if (/^\d+$/.test(value)) {
		return Number(value) * 1000;
	}
	const date = parseHttpDate(value, now);
	return date === undefined ? undefined : Math.max(0, date - now);
}

/**
 * How long to wait, in milliseconds, before retry number `retry` (1-based) of a 429: its
 * `Retry-After` when readable, else 1s, 2s, 4s jittered by `random()` into [50%, 100%); capped
 * at 30s either way.
 */
function rateLimitDelayMs(
	retry: number,
	retryAfter: number | undefined,
	random: () => number,
): number {
	const delay = retryAfter ?? RATE_LIMIT_BASE_DELAY_MS * 2 ** (retry - 1) * (0.5 + random() * 0.5);
	return Math.min(delay, RATE_LIMIT_MAX_DELAY_MS);
}

/**
 * Whether a retry's wait ends before the deadline, `remaining` milliseconds away. An equal wait
 * does not: the caller's timeout would fire as the retry starts.
 */
const waitsForRetry = (delay: number, remaining: number): boolean => delay < remaining;

/** Seconds rounded half up to two decimals and written as a number: `0`, `0.75`, `1.5`. */
const formatSeconds = (ms: number): string => String(Math.floor((ms / 1000) * 100 + 0.5) / 100);

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
		const delay = rateLimitDelayMs(
			retry,
			retryAfterMs(response.headers.get('retry-after')),
			timing.random,
		);
		if (deadline !== undefined && !waitsForRetry(delay, deadline - timing.now())) {
			return response;
		}
		// Discarded unread: only the final 429's body is reported. Not awaited, since a cancel can
		// wait on a producer that never settles (MSW's, for one), and the retry need not wait.
		void response.body?.cancel().catch(() => undefined);
		warn(
			`${init?.method ?? 'GET'} ${String(input)} was rate limited (429) on attempt ${retry} of ${RATE_LIMIT_MAX_RETRIES + 1}; retrying in ${formatSeconds(delay)}s`,
		);
		if (delay > 0) {
			await timing.sleep(delay, init?.signal);
		}
	}
}
