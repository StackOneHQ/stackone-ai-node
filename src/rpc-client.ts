import { STACKONE_HEADER_KEYS } from './schemas/headers';
import {
	type RpcActionRequest,
	type RpcActionResponse,
	type RpcClientConfig,
	rpcActionRequestSchema,
	rpcActionResponseSchema,
	rpcClientConfigSchema,
} from './schemas/rpc';
import { StackOneAPIError } from './utils/errors';

// Re-export types for consumers and to make types portable
export type { RpcActionResponse } from './schemas/rpc';

/**
 * Custom RPC client for StackOne API.
 * Replaces the @stackone/stackone-client-ts dependency.
 *
 * @see https://docs.stackone.com/platform/api-reference/actions/list-all-actions-metadata
 * @see https://docs.stackone.com/platform/api-reference/actions/make-an-rpc-call-to-an-action
 */
export class RpcClient {
	private readonly baseUrl: string;
	private readonly authHeader: string;

	constructor(config: RpcClientConfig) {
		const validatedConfig = rpcClientConfigSchema.parse(config);
		this.baseUrl = validatedConfig.serverURL || 'https://api.stackone.com';
		const username = validatedConfig.security.username;
		const password = validatedConfig.security.password || '';
		this.authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
	}

	/**
	 * Actions namespace containing RPC methods
	 */
	readonly actions: {
		rpcAction: (request: RpcActionRequest) => Promise<RpcActionResponse>;
	} = {
		/**
		 * Execute an RPC action
		 * @param request The RPC action request
		 * @returns The RPC action response matching server's ActionsRpcResponseApiModel
		 */
		rpcAction: async (request: RpcActionRequest): Promise<RpcActionResponse> => {
			const validatedRequest = rpcActionRequestSchema.parse(request);
			const url = `${this.baseUrl}/actions/rpc`;

			const requestBody = {
				action: validatedRequest.action,
				body: validatedRequest.body,
				headers: validatedRequest.headers,
				path: validatedRequest.path,
				query: validatedRequest.query,
			} as const satisfies RpcActionRequest;

			// Forward StackOne-specific headers as HTTP headers
			const requestHeaders = validatedRequest.headers;
			const forwardedHeaders: Record<string, string> = {};
			if (requestHeaders) {
				for (const key of STACKONE_HEADER_KEYS) {
					const value = requestHeaders[key];
					if (value !== undefined) {
						forwardedHeaders[key] = value;
					}
				}
			}
			const httpHeaders = {
				'Content-Type': 'application/json',
				Authorization: this.authHeader,
				'User-Agent': 'stackone-ai-node',
				...forwardedHeaders,
			} satisfies Record<string, string>;

			const response = await fetch(url, {
				method: 'POST',
				headers: httpHeaders,
				body: JSON.stringify(requestBody),
			});

			const responseBody: unknown = await response.json();

			if (!response.ok) {
				throw new StackOneAPIError(
					`RPC action failed for ${url}`,
					response.status,
					responseBody,
					requestBody,
				);
			}

			const validation = rpcActionResponseSchema.safeParse(responseBody);

			if (!validation.success) {
				throw new StackOneAPIError(
					`Invalid RPC action response for ${url}`,
					response.status,
					responseBody,
					requestBody,
				);
			}

			return validation.data;
		},
	};
}
