/**
 * DynamicToolClient - A lightweight client for executing RPC-backed tools
 *
 * This client is used by generated typed SDK files to execute tools via the
 * StackOne RPC endpoint. It handles authentication and request formatting.
 */
import type { JsonDict } from './types';

export interface DynamicToolClientConfig {
  apiKey: string;
  accountId?: string;
  baseUrl?: string;
  headers?: Record<string, string>;
}

export class DynamicToolClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(config: DynamicToolClientConfig) {
    this.baseUrl = config.baseUrl ?? 'https://api.stackone.com';
    const authToken = Buffer.from(`${config.apiKey}:`).toString('base64');
    this.headers = {
      Authorization: `Basic ${authToken}`,
      ...(config.accountId ? { 'x-account-id': config.accountId } : {}),
      ...(config.headers ?? {}),
    };
  }

  private extractRecord(
    source: Record<string, unknown>,
    key: string
  ): Record<string, unknown> | undefined {
    const value = source[key];
    if (value === undefined || value === null) return undefined;
    return typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : undefined;
  }

  async execute(action: string, params?: Record<string, unknown>): Promise<JsonDict> {
    const parsed = params ?? {};
    const path = this.extractRecord(parsed, 'path');
    const query = this.extractRecord(parsed, 'query');
    const paramHeaders = this.extractRecord(parsed, 'headers');
    const baseHeaders: Record<string, string> = { ...this.headers };

    if (paramHeaders) {
      for (const [key, value] of Object.entries(paramHeaders)) {
        if (value === undefined || value === null) continue;
        baseHeaders[key] = String(value);
      }
    }

    const bodyPayload = this.extractRecord(parsed, 'body') ?? {};
    const rpcBody: JsonDict = { ...bodyPayload };
    for (const [key, value] of Object.entries(parsed)) {
      if (key === 'body' || key === 'headers' || key === 'path' || key === 'query') continue;
      rpcBody[key] = value as unknown;
    }

    const response = await fetch(`${this.baseUrl}/actions/rpc`, {
      method: 'POST',
      headers: {
        ...baseHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        body: rpcBody,
        headers: baseHeaders,
        path: path ?? undefined,
        query: query ?? undefined,
      }),
    });

    const text = await response.text();
    let parsedBody: unknown;
    try {
      parsedBody = text ? JSON.parse(text) : {};
    } catch {
      parsedBody = { raw: text };
    }

    if (!response.ok) {
      throw new Error(
        `RPC error ${response.status}: ${typeof parsedBody === 'string' ? parsedBody : JSON.stringify(parsedBody)}`
      );
    }

    return parsedBody as JsonDict;
  }
}
