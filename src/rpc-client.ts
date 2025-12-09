import type { JsonDict } from './types';
import { StackOneAPIError } from './utils/errors';

/**
 * RPC action request payload
 */
export interface RpcActionRequest {
  action: string;
  body?: JsonDict;
  headers?: Record<string, string>;
  path?: JsonDict;
  query?: JsonDict;
}

/**
 * RPC action response from the StackOne API
 */
export interface RpcActionResponse {
  actionsRpcResponse?: JsonDict;
}

/**
 * Configuration for the RPC client
 */
export interface RpcClientConfig {
  serverURL?: string;
  security: {
    username: string;
    password?: string;
  };
}

/**
 * Custom RPC client for StackOne API
 * Replaces the @stackone/stackone-client-ts dependency
 */
export class RpcClient {
  private readonly baseUrl: string;
  private readonly authHeader: string;

  constructor(config: RpcClientConfig) {
    this.baseUrl = config.serverURL || 'https://api.stackone.com';
    const username = config.security.username;
    const password = config.security.password || '';
    this.authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
  }

  /**
   * Actions namespace containing RPC methods
   */
  readonly actions = {
    /**
     * Execute an RPC action
     * @param request The RPC action request
     * @returns The RPC action response
     */
    rpcAction: async (request: RpcActionRequest): Promise<RpcActionResponse> => {
      const url = `${this.baseUrl}/actions/rpc`;

      const requestBody = {
        action: request.action,
        body: request.body,
        headers: request.headers,
        path: request.path,
        query: request.query,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.authHeader,
          'User-Agent': 'stackone-ai-node',
        },
        body: JSON.stringify(requestBody),
      });

      const responseBody: unknown = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new StackOneAPIError(
          `RPC action failed for ${url}`,
          response.status,
          responseBody,
          requestBody
        );
      }

      return {
        actionsRpcResponse: responseBody as JsonDict,
      };
    },
  };
}
