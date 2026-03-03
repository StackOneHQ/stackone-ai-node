import { ToolIndex, type ToolSearchResult } from './local-search';
import { BaseTool } from './tool';
import { ParameterLocation } from './types';

function createMockTools(): BaseTool[] {
	return [
		new BaseTool(
			'bamboohr_create_employee',
			'Create a new employee record in the HRIS system',
			{ type: 'object', properties: {} },
			{
				kind: 'http',
				method: 'POST',
				url: 'https://api.example.com/hris/employees',
				bodyType: 'json',
				params: [],
			},
		),
		new BaseTool(
			'bamboohr_list_employees',
			'List all employees in the HRIS system',
			{ type: 'object', properties: {} },
			{
				kind: 'http',
				method: 'GET',
				url: 'https://api.example.com/hris/employees',
				bodyType: 'json',
				params: [],
			},
		),
		new BaseTool(
			'bamboohr_create_time_off',
			'Create a time off request for an employee',
			{ type: 'object', properties: {} },
			{
				kind: 'http',
				method: 'POST',
				url: 'https://api.example.com/hris/time-off',
				bodyType: 'json',
				params: [],
			},
		),
		new BaseTool(
			'workday_create_candidate',
			'Create a new candidate in the ATS',
			{ type: 'object', properties: {} },
			{
				kind: 'http',
				method: 'POST',
				url: 'https://api.example.com/ats/candidates',
				bodyType: 'json',
				params: [],
			},
		),
		new BaseTool(
			'workday_list_candidates',
			'List all candidates in the ATS',
			{ type: 'object', properties: {} },
			{
				kind: 'http',
				method: 'GET',
				url: 'https://api.example.com/ats/candidates',
				bodyType: 'json',
				params: [],
			},
		),
		new BaseTool(
			'salesforce_create_contact',
			'Create a new contact in the CRM',
			{ type: 'object', properties: {} },
			{
				kind: 'http',
				method: 'POST',
				url: 'https://api.example.com/crm/contacts',
				bodyType: 'json',
				params: [],
			},
		),
	];
}

describe('ToolIndex', () => {
	describe('search', () => {
		it('should find relevant employee tools', async () => {
			const tools = createMockTools();
			const index = new ToolIndex(tools);
			const results = await index.search('manage employees');

			const resultNames = results.map((r) => r.name);
			expect(resultNames).toContain('bamboohr_create_employee');
			expect(resultNames).toContain('bamboohr_list_employees');
		});

		it('should find time off tools', async () => {
			const tools = createMockTools();
			const index = new ToolIndex(tools);
			const results = await index.search('time off request vacation leave');

			const resultNames = results.map((r) => r.name);
			expect(resultNames).toContain('bamboohr_create_time_off');
		});

		it('should respect limit parameter', async () => {
			const tools = createMockTools();
			const index = new ToolIndex(tools);
			const results = await index.search('create', 2);

			expect(results.length).toBeLessThanOrEqual(2);
		});

		it('should filter by minimum score', async () => {
			const tools = createMockTools();
			const index = new ToolIndex(tools);
			const results = await index.search('xyz123 nonexistent', 5, 0.8);

			expect(results).toHaveLength(0);
		});

		it('should return scores between 0 and 1', async () => {
			const tools = createMockTools();
			const index = new ToolIndex(tools);
			const results = await index.search('employee', 10);

			for (const result of results) {
				expect(result.score).toBeGreaterThanOrEqual(0);
				expect(result.score).toBeLessThanOrEqual(1);
			}
		});

		it('should find candidate tools', async () => {
			const tools = createMockTools();
			const index = new ToolIndex(tools);
			const results = await index.search('candidates');

			const resultNames = results.map((r) => r.name);
			const hasCandidateTool =
				resultNames.includes('workday_create_candidate') ||
				resultNames.includes('workday_list_candidates');
			expect(hasCandidateTool).toBe(true);
		});

		it('should handle empty query', async () => {
			const tools = createMockTools();
			const index = new ToolIndex(tools);
			const results = await index.search('', 5);

			expect(Array.isArray(results)).toBe(true);
		});
	});

	describe('custom alpha', () => {
		it('should work with custom alpha value', async () => {
			const tools = createMockTools();
			const index = new ToolIndex(tools, 0.7);
			const results = await index.search('create candidate');

			const resultNames = results.map((r) => r.name);
			expect(resultNames).toContain('workday_create_candidate');
		});

		it('should work with alpha=0 (TF-IDF only)', async () => {
			const tools = createMockTools();
			const index = new ToolIndex(tools, 0);
			const results = await index.search('employee');

			expect(results.length).toBeGreaterThan(0);
		});

		it('should work with alpha=1 (BM25 only)', async () => {
			const tools = createMockTools();
			const index = new ToolIndex(tools, 1);
			const results = await index.search('employee');

			expect(results.length).toBeGreaterThan(0);
		});
	});
});
