/**
 * Utilities for mocking fetch in tests
 */
import { type Mock, spyOn } from 'bun:test';

/**
 * Response data for a mocked fetch call
 */
export interface MockFetchResponse {
  status?: number;
  statusText?: string;
  ok?: boolean;
  json?: () => Promise<any>;
  text?: () => Promise<string>;
  headers?: Record<string, string>;
}

/**
 * Options for creating a fetch mock
 */
export interface MockFetchOptions {
  /**
   * Default response to return from the mock
   */
  defaultResponse?: MockFetchResponse;

  /**
   * Callback to execute when fetch is called
   * Can be used to capture request data or customize the response
   */
  onFetch?: (url: string, options?: RequestInit) => void;
}

/**
 * Result of creating a fetch mock
 */
export interface FetchMockResult {
  /**
   * The spy object for the fetch mock
   */
  fetchSpy: Mock<typeof fetch>;

  /**
   * The captured request headers from the last fetch call
   */
  requestHeaders: Record<string, string>;

  /**
   * The captured request body from the last fetch call
   */
  requestBody: any;

  /**
   * The captured URL from the last fetch call
   */
  requestUrl: string;

  /**
   * The captured request options from the last fetch call
   */
  requestOptions: RequestInit | undefined;

  /**
   * Restore the original fetch implementation
   */
  restore: () => void;
}

/**
 * Create a mock for the global fetch function
 * @param options Options for the mock
 * @returns The mock result
 */
export const mockFetch = (options: MockFetchOptions = {}): FetchMockResult => {
  const result: FetchMockResult = {
    fetchSpy: {} as Mock<typeof fetch>,
    requestHeaders: {},
    requestBody: undefined,
    requestUrl: '',
    requestOptions: undefined,
    restore: () => {},
  };

  // Default response
  const defaultResponse: MockFetchResponse = {
    status: 200,
    statusText: 'OK',
    ok: true,
    json: async () => ({}),
    text: async () => '{}',
    ...options.defaultResponse,
  };

  // Create the spy
  result.fetchSpy = spyOn(globalThis, 'fetch').mockImplementation(
    async (input: string | URL | Request, requestOptions?: RequestInit) => {
      // Capture request data
      result.requestUrl = input instanceof Request ? input.url : input.toString();
      result.requestOptions = requestOptions;
      result.requestHeaders = (requestOptions?.headers as Record<string, string>) || {};

      // Capture body if present
      if (requestOptions?.body) {
        try {
          if (typeof requestOptions.body === 'string') {
            result.requestBody = JSON.parse(requestOptions.body);
          } else {
            result.requestBody = requestOptions.body;
          }
        } catch (_e) {
          result.requestBody = requestOptions.body;
        }
      }

      // Call the onFetch callback if provided
      if (options.onFetch) {
        options.onFetch(result.requestUrl, requestOptions);
      }

      // Return the response
      return {
        ok: defaultResponse.ok ?? true,
        status: defaultResponse.status ?? 200,
        statusText: defaultResponse.statusText ?? 'OK',
        json: defaultResponse.json ?? (async () => ({})),
        text: defaultResponse.text ?? (async () => '{}'),
        headers: new Headers(defaultResponse.headers || {}),
        clone: () =>
          ({
            ok: defaultResponse.ok ?? true,
            status: defaultResponse.status ?? 200,
            statusText: defaultResponse.statusText ?? 'OK',
            json: defaultResponse.json ?? (async () => ({})),
            text: defaultResponse.text ?? (async () => '{}'),
          }) as Response,
        body: null,
        bodyUsed: false,
        arrayBuffer: async () => new ArrayBuffer(0),
        blob: async () => new Blob([]),
        formData: async () => new FormData(),
        redirected: false,
        type: 'basic',
        url: result.requestUrl,
      } as Response;
    }
  );

  // Set up the restore function
  result.restore = () => {
    result.fetchSpy.mockRestore();
  };

  return result;
};
