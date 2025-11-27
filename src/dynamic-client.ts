/**
 * DynamicToolClient - A lightweight client for executing tools
 *
 * This client is used by generated typed SDK files to execute tools.
 * For unified API actions (prefixed with 'unified_'), it calls the REST API directly.
 * For other actions, it uses the RPC endpoint.
 */
import type { JsonDict } from './types';

export interface DynamicToolClientConfig {
  apiKey: string;
  accountId?: string;
  baseUrl?: string;
  headers?: Record<string, string>;
}

/**
 * Parses a unified action name and returns the HTTP method and URL path.
 *
 * Action name format: unified_{vertical}_{operation}_{resource}[_{subresource}...]
 *
 * Examples:
 * - unified_hris_list_employees -> GET /unified/hris/employees
 * - unified_hris_get_employees -> GET /unified/hris/employees/{id}
 * - unified_hris_create_employees -> POST /unified/hris/employees
 * - unified_hris_update_employees -> PATCH /unified/hris/employees/{id}
 * - unified_hris_list_employees_documents -> GET /unified/hris/employees/{id}/documents
 * - unified_hris_get_employees_documents -> GET /unified/hris/employees/{id}/documents/{subId}
 */
function parseUnifiedAction(
  action: string,
  pathParams?: Record<string, unknown>
): { method: string; path: string } | null {
  if (!action.startsWith('unified_')) {
    return null;
  }

  const parts = action.split('_');
  // parts[0] = 'unified', parts[1] = vertical (e.g., 'hris'), parts[2] = operation, rest = resource path
  if (parts.length < 4) {
    return null;
  }

  const vertical = parts[1];
  const operation = parts[2];
  const resourceParts = parts.slice(3);

  // Determine HTTP method based on operation
  let method: string;
  let needsId = false;
  let needsSubId = false;

  switch (operation) {
    case 'list':
      method = 'GET';
      // For nested resources like list_employees_documents, we need the parent ID
      needsId = resourceParts.length > 1;
      break;
    case 'get':
      method = 'GET';
      needsId = true;
      // For nested resources like get_employees_documents, we need both IDs
      needsSubId = resourceParts.length > 1;
      break;
    case 'create':
      method = 'POST';
      // For nested resources like create_employees_completions, we need the parent ID
      needsId = resourceParts.length > 1;
      break;
    case 'update':
      method = 'PATCH';
      needsId = true;
      break;
    case 'delete':
      method = 'DELETE';
      needsId = true;
      break;
    case 'download':
      method = 'GET';
      needsId = true;
      needsSubId = resourceParts.length > 1;
      break;
    case 'upsert':
      method = 'PUT';
      needsId = resourceParts.length > 1;
      break;
    default:
      // Unknown operation, fall back to RPC
      return null;
  }

  // Build the URL path
  // Convert underscores in resource parts to slashes, and handle path parameters
  const pathSegments = [`/unified/${vertical}`];

  for (let i = 0; i < resourceParts.length; i++) {
    const resourceName = resourceParts[i].replace(/_/g, '-');
    pathSegments.push(resourceName);

    // Insert path parameter after first resource if needed
    if (i === 0 && needsId && pathParams) {
      const id = pathParams.id ?? pathParams[`${resourceParts[0]}_id`];
      if (id) {
        pathSegments.push(String(id));
      }
    }

    // Insert sub-resource ID if needed
    if (i === 1 && needsSubId && pathParams) {
      const subId = pathParams.subId ?? pathParams[`${resourceParts[1]}_id`];
      if (subId) {
        pathSegments.push(String(subId));
      }
    }
  }

  return { method, path: pathSegments.join('/') };
}

/**
 * Builds a query string from a record of parameters.
 * Handles nested objects like filter[updated_after]=xxx
 */
function buildQueryString(query: Record<string, unknown>): string {
  const params = new URLSearchParams();

  function addParams(obj: Record<string, unknown>, prefix = ''): void {
    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined || value === null || value === '') continue;

      const paramKey = prefix ? `${prefix}[${key}]` : key;

      if (typeof value === 'object' && !Array.isArray(value)) {
        // Recursively handle nested objects (e.g., filter)
        addParams(value as Record<string, unknown>, paramKey);
      } else if (Array.isArray(value)) {
        // Handle arrays
        params.set(paramKey, value.join(','));
      } else {
        params.set(paramKey, String(value));
      }
    }
  }

  addParams(query);

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
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

    // Check if this is a unified action that should use direct API
    const unifiedRoute = parseUnifiedAction(action, path);

    if (unifiedRoute) {
      return this.executeDirectApi(unifiedRoute, query, parsed, baseHeaders);
    }

    // Fall back to RPC for non-unified actions
    return this.executeRpc(action, parsed, path, query, baseHeaders);
  }

  private async executeDirectApi(
    route: { method: string; path: string },
    query: Record<string, unknown> | undefined,
    params: Record<string, unknown>,
    headers: Record<string, string>
  ): Promise<JsonDict> {
    const queryString = query ? buildQueryString(query) : '';
    const url = `${this.baseUrl}${route.path}${queryString}`;

    const body = this.extractRecord(params, 'body');
    const hasBody = route.method !== 'GET' && route.method !== 'DELETE' && body;

    const response = await fetch(url, {
      method: route.method,
      headers: {
        ...headers,
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(hasBody ? { body: JSON.stringify(body) } : {}),
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
        `API error ${response.status}: ${typeof parsedBody === 'string' ? parsedBody : JSON.stringify(parsedBody)}`
      );
    }

    return parsedBody as JsonDict;
  }

  private async executeRpc(
    action: string,
    params: Record<string, unknown>,
    path: Record<string, unknown> | undefined,
    query: Record<string, unknown> | undefined,
    headers: Record<string, string>
  ): Promise<JsonDict> {
    const bodyPayload = this.extractRecord(params, 'body') ?? {};
    const rpcBody: JsonDict = { ...bodyPayload };

    for (const [key, value] of Object.entries(params)) {
      if (key === 'body' || key === 'headers' || key === 'path' || key === 'query') continue;
      rpcBody[key] = value as unknown;
    }

    const response = await fetch(`${this.baseUrl}/actions/rpc`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        body: rpcBody,
        headers,
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
