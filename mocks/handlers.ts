import { http, HttpResponse } from 'msw';

export const handlers = [
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

  // Default handler for unmatched requests
  http.get('*', () => {
    return HttpResponse.json({ message: 'Mock endpoint' });
  }),
];
