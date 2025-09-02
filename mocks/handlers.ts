import { http, HttpResponse } from 'msw';

export const handlers = [
  // StackOne Unified HRIS endpoints used by examples
  http.get('https://api.stackone.com/unified/hris/employees', () => {
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

  http.get(
    'https://api.stackone.com/unified/hris/employees/:id',
    ({ params }) => {
      return HttpResponse.json({
        id: params.id,
        name: 'Michael Scott',
        phone_numbers: ['+1-555-0100'],
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

  // Default handler for unmatched requests
  http.get('*', () => {
    return HttpResponse.json({ message: 'Mock endpoint' });
  }),
];
