import { z } from 'zod';
import { StackOneAPIError } from './utils/errors';

/**
 * Zod schema for RPC action request validation
 * @see https://docs.stackone.com/platform/api-reference/actions/make-an-rpc-call-to-an-action
 */
const rpcActionRequestSchema = z.object({
  action: z.string(),
  body: z.record(z.unknown()).optional(),
  headers: z.record(z.unknown()).optional(),
  path: z.record(z.unknown()).optional(),
  query: z.record(z.unknown()).optional(),
});

/**
 * RPC action request payload
 */
export type RpcActionRequest = z.infer<typeof rpcActionRequestSchema>;

/**
 * Zod schema for RPC action response data
 */
const rpcActionResponseDataSchema = z.union([
  z.record(z.unknown()),
  z.array(z.record(z.unknown())),
  z.null(),
]);

/**
 * Zod schema for RPC action response validation
 *
 * The server returns a flexible JSON structure. Known fields:
 * - `data`: The main response data (object, array, or null)
 * - `next`: Pagination cursor for fetching next page
 *
 * Additional fields from the connector response are passed through.
 * @see unified-cloud-api/src/unified-api-v2/unifiedAPIv2.service.ts processActionCall
 */
const rpcActionResponseSchema = z
  .object({
    next: z.string().nullish(),
    data: rpcActionResponseDataSchema.optional(),
  })
  .passthrough();

/**
 * RPC action response data type - can be object, array of objects, or null
 */
export type RpcActionResponseData = z.infer<typeof rpcActionResponseDataSchema>;

/**
 * RPC action response from the StackOne API
 * Contains known fields (data, next) plus any additional fields from the connector
 */
export type RpcActionResponse = z.infer<typeof rpcActionResponseSchema>;

/**
 * Zod schema for RPC client configuration validation
 */
const rpcClientConfigSchema = z.object({
  serverURL: z.string().optional(),
  security: z.object({
    username: z.string(),
    password: z.string().optional(),
  }),
});

/**
 * Configuration for the RPC client
 */
export type RpcClientConfig = z.infer<typeof rpcClientConfigSchema>;

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
  readonly actions = {
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

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.authHeader,
          'User-Agent': 'stackone-ai-node',
        },
        body: JSON.stringify(requestBody),
      });

      const responseBody: unknown = await response.json();

      if (!response.ok) {
        throw new StackOneAPIError(
          `RPC action failed for ${url}`,
          response.status,
          responseBody,
          requestBody
        );
      }

      const validation = rpcActionResponseSchema.safeParse(responseBody);

      if (!validation.success) {
        throw new StackOneAPIError(
          `Invalid RPC action response for ${url}`,
          response.status,
          responseBody,
          requestBody
        );
      }

      return validation.data;
    },
  };
}
