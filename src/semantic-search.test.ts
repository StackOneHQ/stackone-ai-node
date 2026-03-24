import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { SemanticSearchClient, SemanticSearchError } from './semantic-search';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const TEST_API_KEY = 'test-api-key';
const TEST_BASE_URL = 'http://localhost';

function createClient(options?: { baseUrl?: string; timeout?: number }): SemanticSearchClient {
	return new SemanticSearchClient({
		apiKey: TEST_API_KEY,
		baseUrl: options?.baseUrl ?? TEST_BASE_URL,
		timeout: options?.timeout,
	});
}

describe('SemanticSearchClient', () => {
	describe('search', () => {
		test('returns parsed search results', async () => {
			server.use(
				http.post(`${TEST_BASE_URL}/actions/search`, async ({ request }) => {
					const body = (await request.json()) as Record<string, unknown>;
					expect(body.query).toBe('create employee');
					expect(body.connector).toBe('bamboohr');
					expect(body.top_k).toBe(5);

					return HttpResponse.json({
						results: [
							{
								id: 'bamboohr_1.0.0_bamboohr_create_employee_global',
								similarity_score: 0.95,
							},
							{
								id: 'bamboohr_1.0.0_bamboohr_update_employee_global',
								similarity_score: 0.82,
							},
						],
						total_count: 2,
						query: 'create employee',
						connector_filter: 'bamboohr',
					});
				}),
			);

			const client = createClient();
			const response = await client.search('create employee', {
				connector: 'bamboohr',
				topK: 5,
			});

			expect(response.results).toHaveLength(2);
			expect(response.results[0].id).toBe('bamboohr_1.0.0_bamboohr_create_employee_global');
			expect(response.results[0].similarityScore).toBe(0.95);
			expect(response.totalCount).toBe(2);
			expect(response.query).toBe('create employee');
			expect(response.connectorFilter).toBe('bamboohr');
		});

		test('sends correct auth header', async () => {
			server.use(
				http.post(`${TEST_BASE_URL}/actions/search`, ({ request }) => {
					const auth = request.headers.get('Authorization');
					const expected = `Basic ${Buffer.from(`${TEST_API_KEY}:`).toString('base64')}`;
					expect(auth).toBe(expected);

					return HttpResponse.json({
						results: [],
						total_count: 0,
						query: 'test',
					});
				}),
			);

			const client = createClient();
			await client.search('test');
		});

		test('sends optional parameters only when provided', async () => {
			server.use(
				http.post(`${TEST_BASE_URL}/actions/search`, async ({ request }) => {
					const body = (await request.json()) as Record<string, unknown>;
					expect(body.query).toBe('test');
					expect(body).not.toHaveProperty('connector');
					expect(body).not.toHaveProperty('top_k');
					expect(body).not.toHaveProperty('project_id');
					expect(body).not.toHaveProperty('min_similarity');

					return HttpResponse.json({
						results: [],
						total_count: 0,
						query: 'test',
					});
				}),
			);

			const client = createClient();
			await client.search('test');
		});

		test('sends min_similarity when provided', async () => {
			server.use(
				http.post(`${TEST_BASE_URL}/actions/search`, async ({ request }) => {
					const body = (await request.json()) as Record<string, unknown>;
					expect(body.min_similarity).toBe(0.7);

					return HttpResponse.json({
						results: [],
						total_count: 0,
						query: 'test',
					});
				}),
			);

			const client = createClient();
			await client.search('test', { minSimilarity: 0.7 });
		});

		test('throws SemanticSearchError on HTTP error', async () => {
			server.use(
				http.post(`${TEST_BASE_URL}/actions/search`, () => {
					return new HttpResponse('Internal Server Error', { status: 500 });
				}),
			);

			const client = createClient();
			await expect(client.search('test')).rejects.toThrow(SemanticSearchError);
			await expect(client.search('test')).rejects.toThrow('API error: 500');
		});

		test('throws SemanticSearchError on network error', async () => {
			server.use(
				http.post(`${TEST_BASE_URL}/actions/search`, () => {
					return HttpResponse.error();
				}),
			);

			const client = createClient();
			await expect(client.search('test')).rejects.toThrow(SemanticSearchError);
		});

		test('strips trailing slashes from base URL', async () => {
			server.use(
				http.post(`${TEST_BASE_URL}/actions/search`, () => {
					return HttpResponse.json({
						results: [],
						total_count: 0,
						query: 'test',
					});
				}),
			);

			const client = createClient({ baseUrl: `${TEST_BASE_URL}///` });
			const response = await client.search('test');
			expect(response.totalCount).toBe(0);
		});
	});

	describe('searchActionNames', () => {
		test('returns just action IDs', async () => {
			server.use(
				http.post(`${TEST_BASE_URL}/actions/search`, () => {
					return HttpResponse.json({
						results: [
							{
								id: 'bamboohr_1.0.0_bamboohr_create_employee_global',
								similarity_score: 0.95,
							},
							{
								id: 'hibob_1.0.0_hibob_create_employee_global',
								similarity_score: 0.88,
							},
						],
						total_count: 2,
						query: 'create employee',
					});
				}),
			);

			const client = createClient();
			const names = await client.searchActionNames('create employee');
			expect(names).toEqual([
				'bamboohr_1.0.0_bamboohr_create_employee_global',
				'hibob_1.0.0_hibob_create_employee_global',
			]);
		});
	});
});
