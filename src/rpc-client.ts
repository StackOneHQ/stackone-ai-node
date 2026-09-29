import { buildRequestHeaders } from './headers';
import type { JsonObject } from './types';
import {
	type BinaryDownloadResult,
	binaryDownloadFromResponse,
	isJsonContentType,
} from './utils/binary-response';
import { StackOneAPIError, describeApiFailure } from './utils/error-stackone-api';
import { StackOneError } from './utils/error-stackone';

/**
 * The `/actions/rpc` request body.
 *
 * @see https://docs.stackone.com/platform/api-reference/actions/make-an-rpc-call-to-an-action
 */
export interface RpcActionRequest {
	action: string;
	body: JsonObject;
	headers: Record<string, string>;
	path?: JsonObject;
	query?: JsonObject;
}

/**
 * A bodyless success (`204`/`205`, or an empty JSON body). Not a file download: returning an
 * empty `content` with a made-up content type would break any caller that re-serialises results.
 */
interface EmptyRpcResult {
	statusCode: number;
}

interface RpcClientConfig {
	baseUrl: string;
	apiKey: string;
	/** Request timeout in milliseconds. */
	timeout: number;
	/** Extra HTTP headers sent with every request, beneath the SDK's own. */
	headers?: Record<string, string>;
}

const readErrorBody = async (response: Response): Promise<unknown> => {
	const text = await response.text().catch(() => '');
	if (!text) {
		return null;
	}
	try {
		return JSON.parse(text) as unknown;
	} catch {
		return text;
	}
};

/**
 * Client for the StackOne actions RPC endpoint.
 *
 * The account a request runs against is the `x-account-id` HTTP header, set here from the tool's
 * own account — never read out of the envelope, whose contents are model-supplied.
 */
export class RpcClient {
	readonly url: string;
	readonly #apiKey: string;
	readonly #timeout: number;
	readonly #headers: Record<string, string>;

	constructor(config: RpcClientConfig) {
		this.url = `${config.baseUrl.replace(/\/+$/, '')}/actions/rpc`;
		this.#apiKey = config.apiKey;
		this.#timeout = config.timeout;
		this.#headers = { ...config.headers };
	}

	/**
	 * The HTTP headers a request for `accountId` carries.
	 */
	requestHeaders(accountId: string | undefined): Record<string, string> {
		return {
			'Content-Type': 'application/json',
			...buildRequestHeaders({ apiKey: this.#apiKey, accountId, extraHeaders: this.#headers }),
		};
	}

	/**
	 * Execute an RPC action.
	 *
	 * @returns The parsed JSON response (a non-object body is wrapped as `{ result }`); for a
	 *   file-download action served as raw binary, a {@link BinaryDownloadResult}; for a bodyless
	 *   success, `{ statusCode }`.
	 * @throws StackOneAPIError When the API answers with an error status, or with a JSON content
	 *   type whose body is not JSON.
	 * @throws StackOneError When the request cannot be sent or times out.
	 */
	async rpcAction(
		request: RpcActionRequest,
		accountId: string | undefined,
	): Promise<JsonObject | BinaryDownloadResult | EmptyRpcResult> {
		let body: string;
		try {
			body = JSON.stringify(request);
		} catch (error) {
			// A BigInt or a cycle: an argument problem, reported as one rather than escaping as a
			// bare TypeError from inside fetch.
			throw new StackOneError(
				`Arguments for "${request.action}" could not be encoded as JSON: ${error instanceof Error ? error.message : String(error)}`,
				{ cause: error },
			);
		}

		let response: Response;
		try {
			response = await fetch(this.url, {
				method: 'POST',
				headers: this.requestHeaders(accountId),
				body,
				signal: AbortSignal.timeout(this.#timeout),
			});
		} catch (error) {
			if (
				error instanceof Error &&
				(error.name === 'TimeoutError' || error.name === 'AbortError')
			) {
				throw new StackOneError(`Request to ${this.url} timed out after ${this.#timeout}ms`, {
					cause: error,
				});
			}
			throw new StackOneError(
				`Request failed: ${error instanceof Error ? error.message : String(error)}`,
				{ cause: error },
			);
		}

		if (!response.ok) {
			const errorBody = await readErrorBody(response);
			throw new StackOneAPIError(
				describeApiFailure(response.status, response.statusText, errorBody, this.url),
				response.status,
				errorBody,
				request,
			);
		}

		const contentType = response.headers.get('content-type') ?? '';
		if (response.status === 204 || response.status === 205) {
			return { statusCode: response.status };
		}
		if (!isJsonContentType(contentType)) {
			// A non-JSON success is a file download (e.g. a *_download_file action): raw bytes
			// with the file's own MIME type and a Content-Disposition. A zero-byte body with a
			// download content type is an empty file, with a filename the caller still needs.
			return binaryDownloadFromResponse(response);
		}

		const text = await response.text();
		if (!text) {
			return { statusCode: response.status };
		}
		let parsed: unknown;
		try {
			parsed = JSON.parse(text);
		} catch (error) {
			// Not the caller's arguments — the server sent a JSON content type with a body that
			// is not JSON. Blaming the arguments here sends people to debug the wrong end.
			throw new StackOneAPIError(
				`Server sent malformed JSON for "${request.action}": ${error instanceof Error ? error.message : String(error)}`,
				response.status,
				text.slice(0, 500),
				request,
				{ cause: error },
			);
		}
		return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
			? (parsed as JsonObject)
			: { result: parsed as JsonObject[string] };
	}
}
