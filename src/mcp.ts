import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { version } from '../package.json';

interface MCPClientOptions {
  baseUrl: string;
  headers?: Record<string, string>;
}

interface MCPClient {
  /** underlying MCP client */
  client: Client;

  /** underlying transport */
  transport: StreamableHTTPClientTransport;

  /** cleanup client and transport */
  [Symbol.asyncDispose](): Promise<void>;
}

const DEFAULT_MCP_CLIENT_OPTIONS = {
  baseUrl: 'https://api.modelcontextprotocol.org',
  headers: {},
} as const satisfies MCPClientOptions;

/**
 * Create a Model Context Protocol (MCP) client.
 *
 * @example
 * ```ts
 * import { createMCPClient } from '@stackone/ai';
 *
 * await using clients = await createMCPClient({
 *   baseUrl: 'https://api.modelcontextprotocol.org',
 *   headers: {
 *     'Authorization': 'Bearer YOUR_API_KEY',
 *   },
 * });
 * ```
 */
export async function createMCPClient({
  baseUrl,
  headers,
}: MCPClientOptions = DEFAULT_MCP_CLIENT_OPTIONS): Promise<MCPClient> {
  const transport = new StreamableHTTPClientTransport(new URL(baseUrl), {
    requestInit: {
      headers,
    },
  });

  const client = new Client({
    name: 'StackOne AI SDK',
    version,
  });

  return {
    client,
    transport,
    async [Symbol.asyncDispose]() {
      await Promise.all([client.close(), transport.close()]);
    },
  };
}
