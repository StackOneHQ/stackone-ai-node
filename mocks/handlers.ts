import { http, HttpResponse } from 'msw';
import { accountMcpTools, createMcpApp, defaultMcpTools, mixedProviderTools } from './mcp-server';

// Create MCP apps for testing
const defaultMcpApp = createMcpApp({
  accountTools: {
    default: defaultMcpTools,
    acc1: accountMcpTools.acc1,
    acc2: accountMcpTools.acc2,
    acc3: accountMcpTools.acc3,
    'test-account': accountMcpTools['test-account'],
    mixed: mixedProviderTools,
  },
});

// Helper to extract text content from OpenAI responses API input
const extractTextFromInput = (input: unknown): string => {
  if (!Array.isArray(input)) return '';
  for (const item of input) {
    if (typeof item === 'object' && item !== null) {
      const obj = item as Record<string, unknown>;
      if (obj.role === 'user' && Array.isArray(obj.content)) {
        for (const content of obj.content) {
          if (
            typeof content === 'object' &&
            content !== null &&
            (content as Record<string, unknown>).type === 'input_text'
          ) {
            return String((content as Record<string, unknown>).text ?? '');
          }
        }
      }
      // For chat completions format
      if (obj.role === 'user' && typeof obj.content === 'string') {
        return obj.content;
      }
    }
  }
  return '';
};

export const handlers = [
  // ============================================================
  // OpenAI API endpoints for AI SDK and OpenAI integration examples
  // ============================================================

  // OpenAI Responses API (used by AI SDK)
  http.post('https://api.openai.com/v1/responses', async ({ request }) => {
    const body = (await request.json()) as {
      input?: unknown;
      tools?: Array<{ name?: string }>;
    };
    const userMessage = extractTextFromInput(body.input);
    const hasTools = body.tools && body.tools.length > 0;

    // For ai-sdk-integration.ts
    if (hasTools && userMessage.includes('Get all details')) {
      return HttpResponse.json({
        id: 'resp_mock_ai_sdk',
        object: 'response',
        created_at: Date.now(),
        model: 'gpt-5',
        status: 'completed',
        output: [
          {
            type: 'message',
            id: 'msg_mock_ai_sdk',
            role: 'assistant',
            status: 'completed',
            content: [
              {
                type: 'output_text',
                text: 'The employee Michael Scott has the following details: ID c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA, phone +1-555-0100.',
                annotations: [],
              },
            ],
          },
        ],
        usage: { input_tokens: 100, output_tokens: 50, total_tokens: 150 },
      });
    }

    // For human-in-the-loop.ts
    if (hasTools && userMessage.includes('Create a new employee')) {
      return HttpResponse.json({
        id: 'resp_mock_hitl',
        object: 'response',
        created_at: Date.now(),
        model: 'gpt-5',
        status: 'completed',
        output: [
          {
            type: 'function_call',
            id: 'call_mock_create',
            call_id: 'call_mock_create',
            name: 'hris_create_employee',
            arguments: JSON.stringify({
              name: 'John Doe',
              personal_email: 'john.doe@example.com',
              department: 'Engineering',
              start_date: '2025-01-01',
              hire_date: '2025-01-01',
            }),
            status: 'completed',
          },
        ],
        usage: { input_tokens: 100, output_tokens: 50, total_tokens: 150 },
      });
    }

    // Default response
    return HttpResponse.json({
      id: 'resp_default',
      object: 'response',
      created_at: Date.now(),
      model: 'gpt-5',
      status: 'completed',
      output: [
        {
          type: 'message',
          id: 'msg_default',
          role: 'assistant',
          status: 'completed',
          content: [{ type: 'output_text', text: 'Mock response', annotations: [] }],
        },
      ],
      usage: { input_tokens: 10, output_tokens: 10, total_tokens: 20 },
    });
  }),

  // OpenAI Chat Completions API (used by OpenAI SDK directly)
  http.post('https://api.openai.com/v1/chat/completions', async ({ request }) => {
    const body = (await request.json()) as {
      messages?: Array<{ content?: string; role?: string }>;
      tools?: Array<{ function?: { name?: string } }>;
    };
    const userMessage =
      body.messages?.find((m) => m.role === 'user' && m.content?.includes('employee'))?.content ??
      '';
    const hasTools = body.tools && body.tools.length > 0;

    // For openai-integration.ts - returns tool call for hris_get_employee
    if (hasTools && userMessage.includes('c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA')) {
      return HttpResponse.json({
        id: 'chatcmpl-mock',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gpt-5',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [
                {
                  id: 'call_mock',
                  type: 'function',
                  function: {
                    name: 'hris_get_employee',
                    arguments: JSON.stringify({
                      id: 'c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA',
                      fields: 'phone_number',
                    }),
                  },
                },
              ],
            },
            finish_reason: 'tool_calls',
          },
        ],
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
      });
    }

    // For human-in-the-loop.ts - returns tool call for hris_create_employee
    if (hasTools && userMessage.includes('Create a new employee')) {
      return HttpResponse.json({
        id: 'chatcmpl-mock-hitl',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gpt-5',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [
                {
                  id: 'call_mock_create',
                  type: 'function',
                  function: {
                    name: 'hris_create_employee',
                    arguments: JSON.stringify({
                      name: 'John Doe',
                      personal_email: 'john.doe@example.com',
                      department: 'Engineering',
                      start_date: '2025-01-01',
                      hire_date: '2025-01-01',
                    }),
                  },
                },
              ],
            },
            finish_reason: 'tool_calls',
          },
        ],
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
      });
    }

    // Default response
    return HttpResponse.json({
      id: 'chatcmpl-default',
      object: 'chat.completion',
      created: Date.now(),
      model: 'gpt-5',
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content: 'Mock response' },
          finish_reason: 'stop',
        },
      ],
      usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
    });
  }),

  // ============================================================
  // StackOne Actions RPC endpoint
  // ============================================================
  http.post('https://api.stackone.com/actions/rpc', async ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    // Check for authentication
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return HttpResponse.json(
        { error: 'Unauthorized', message: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const body = (await request.json()) as {
      action?: string;
      body?: Record<string, unknown>;
      headers?: Record<string, string>;
      path?: Record<string, string>;
      query?: Record<string, string>;
    };

    // Validate action is provided
    if (!body.action) {
      return HttpResponse.json(
        { error: 'Bad Request', message: 'Action is required' },
        { status: 400 }
      );
    }

    // Return mock response based on action
    if (body.action === 'hris_get_employee') {
      return HttpResponse.json({
        data: {
          id: body.path?.id || 'test-id',
          name: 'Test Employee',
          ...(body.body || {}),
        },
      });
    }

    if (body.action === 'hris_list_employees') {
      return HttpResponse.json({
        data: [
          { id: '1', name: 'Employee 1' },
          { id: '2', name: 'Employee 2' },
        ],
      });
    }

    if (body.action === 'test_error_action') {
      return HttpResponse.json(
        { error: 'Internal Server Error', message: 'Test error response' },
        { status: 500 }
      );
    }

    // Default response for other actions
    return HttpResponse.json({
      data: {
        action: body.action,
        received: {
          body: body.body,
          headers: body.headers,
          path: body.path,
          query: body.query,
        },
      },
    });
  }),

  // ============================================================
  // StackOne Unified HRIS endpoints
  // ============================================================
  http.get('https://api.stackone.com/unified/hris/employees', ({ request }) => {
    const accountId = request.headers.get('x-account-id');

    // For error-handling.ts - invalid account ID should return error
    if (accountId === 'invalid_test_account_id') {
      return HttpResponse.json(
        { error: 'Invalid account ID', message: 'Account not found' },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      data: [
        {
          id: 'c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA',
          name: 'Michael Scott',
          phone_number: '+1-555-0100',
        },
      ],
    });
  }),

  http.get('https://api.stackone.com/unified/hris/employees/:id', ({ params, request }) => {
    const accountId = request.headers.get('x-account-id');

    // For error-handling.ts - invalid account ID
    if (accountId === 'invalid_test_account_id') {
      return HttpResponse.json(
        { error: 'Invalid account ID', message: 'Account not found' },
        { status: 401 }
      );
    }

    // For error-handling.ts - missing required id parameter
    if (!params.id) {
      return HttpResponse.json({ error: 'Missing required parameter: id' }, { status: 400 });
    }

    return HttpResponse.json({
      id: params.id,
      name: 'Michael Scott',
      phone_numbers: ['+1-555-0100'],
    });
  }),

  // POST endpoint for creating employees
  http.post('https://api.stackone.com/unified/hris/employees', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      data: {
        id: 'new-employee-id',
        ...(typeof body === 'object' && body !== null ? body : {}),
      },
    });
  }),

  // Document upload endpoint
  http.post(
    'https://api.stackone.com/unified/hris/employees/:id/documents',
    async ({ params, request }) => {
      const body = await request.json();
      return HttpResponse.json({
        data: {
          id: 'doc-123',
          employee_id: params.id,
          ...(typeof body === 'object' && body !== null ? body : {}),
        },
      });
    }
  ),

  // StackOne API spec endpoints
  http.get('https://api.stackone.com/api/v1/:category/openapi.json', ({ params }) => {
    const { category } = params;
    
    if (category === 'hris') {
      return HttpResponse.json({
        openapi: '3.0.0',
        info: { title: 'HRIS API', version: '1.0.0' },
        paths: { '/employees': {} },
      });
    }
    
    return HttpResponse.json({ error: 'Not found' }, { status: 404 });
  }),

  // Generic test endpoint for tool.spec.ts
  http.get('https://api.example.com/test/:id', ({ params }) => {
    if (params.id === 'invalid') {
      return HttpResponse.json(
        { error: 'Invalid ID' },
        { status: 400, statusText: 'Bad Request' }
      );
    }
    return HttpResponse.json({
      id: params.id,
      name: 'Test',
    });
  }),

  // Petstore API endpoint for openapi.spec.ts
  http.get('https://petstore.swagger.io/v2/pet/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: 'Fluffy',
      status: 'available',
    });
  }),

  // Meta tools test endpoints
  http.post('https://api.example.com/hris/employees', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(body);
  }),
  
  http.get('https://api.example.com/hris/employees', ({ request }) => {
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit');
    return HttpResponse.json({ limit: limit ? Number(limit) : undefined });
  }),
  
  http.post('https://api.example.com/hris/time-off', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(body);
  }),
  
  http.post('https://api.example.com/ats/candidates', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(body);
  }),
  
  http.get('https://api.example.com/ats/candidates', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    return HttpResponse.json({ status });
  }),
  
  http.post('https://api.example.com/crm/contacts', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(body);
  }),

  // StackOne AI tool feedback endpoint
  http.post('https://api.stackone.com/ai/tool-feedback', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      message: 'Feedback successfully stored',
      key: 'test-key.json',
      submitted_at: new Date().toISOString(),
      trace_id: 'test-trace-id',
    });
  }),

  // ============================================================
  // StackOne fetchTools endpoint for fetch-tools.ts example
  // ============================================================
  http.get('https://api.stackone.com/ai/tools', () => {
    return HttpResponse.json({
      tools: [
        {
          name: 'hris_list_employees',
          description: 'List all employees',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'object',
                properties: { limit: { type: 'number' } },
              },
            },
          },
        },
        {
          name: 'hris_get_employee',
          description: 'Get employee by ID',
          parameters: {
            type: 'object',
            properties: { id: { type: 'string' } },
            required: ['id'],
          },
        },
        {
          name: 'hris_create_employee',
          description: 'Create a new employee',
          parameters: {
            type: 'object',
            properties: { name: { type: 'string' }, email: { type: 'string' } },
          },
        },
      ],
    });
  }),

  // ============================================================
  // External OAS spec endpoint for openapi-toolset.ts example
  // ============================================================
  http.get('https://api.eu1.stackone.com/oas/hris.json', () => {
    return HttpResponse.json({
      openapi: '3.0.0',
      info: { title: 'StackOne HRIS API', version: '1.0.0' },
      servers: [{ url: 'https://api.stackone.com/unified' }],
      paths: {
        '/hris/employees': {
          get: {
            operationId: 'hris_list_employees',
            summary: 'List employees',
            parameters: [
              { name: 'limit', in: 'query', schema: { type: 'integer' } },
            ],
            responses: { '200': { description: 'Success' } },
          },
        },
        '/hris/employees/{id}': {
          get: {
            operationId: 'hris_get_employee',
            summary: 'Get employee by ID',
            parameters: [
              { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            ],
            responses: { '200': { description: 'Success' } },
          },
        },
      },
    });
  }),

  // ============================================================
  // MCP Protocol endpoints (delegated to Hono app)
  // ============================================================
  http.all('https://api.stackone.com/mcp', async ({ request }) => {
    return defaultMcpApp.fetch(request);
  }),
  http.all('https://api.stackone-dev.com/mcp', async ({ request }) => {
    return defaultMcpApp.fetch(request);
  }),
];
