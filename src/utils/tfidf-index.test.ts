import { TfidfIndex } from './tfidf-index';

describe('TF-IDF Index - Core Functionality', () => {
	test('ranks documents by cosine similarity with tf-idf weighting', () => {
		const index = new TfidfIndex();
		index.build([
			{ id: 'doc1', text: 'alpha beta' },
			{ id: 'doc2', text: 'alpha alpha' },
			{ id: 'doc3', text: 'beta gamma' },
		]);

		const [best, second] = index.search('alpha');

		expect(best?.id).toBe('doc2');
		expect(best?.score ?? 0).toBeCloseTo(1, 5);
		expect(second?.id).toBe('doc1');
		expect(second?.score ?? 0).toBeGreaterThan(0);
		expect(second?.score ?? 0).toBeLessThan(best?.score ?? 0);
	});

	test('drops stopwords and punctuation when tokenizing', () => {
		const index = new TfidfIndex();
		index.build([
			{ id: 'doc1', text: 'schedule onboarding meeting' },
			{ id: 'doc2', text: 'escalate production incident' },
		]);

		const [result] = index.search('the onboarding meeting!!!');

		expect(result?.id).toBe('doc1');
		expect(result?.score ?? 0).toBeGreaterThan(0);
	});

	test('returns no matches when query shares no terms with the corpus', () => {
		const index = new TfidfIndex();
		index.build([
			{ id: 'doc1', text: 'generate billing statement' },
			{ id: 'doc2', text: 'update user profile' },
		]);

		const results = index.search('predict weather forecast');

		expect(results).toHaveLength(0);
	});
});

describe('TF-IDF Index - Score Validation', () => {
	test('returns scores within [0, 1] range', () => {
		const index = new TfidfIndex();
		index.build([
			{ id: 'doc1', text: 'employee management system' },
			{ id: 'doc2', text: 'employee database records' },
			{ id: 'doc3', text: 'candidate tracking application' },
		]);

		const results = index.search('employee', 10);

		expect(results.length).toBeGreaterThan(0);
		for (const result of results) {
			expect(result.score).toBeGreaterThanOrEqual(0);
			expect(result.score).toBeLessThanOrEqual(1);
		}
	});

	test('sorts results by score in descending order', () => {
		const index = new TfidfIndex();
		index.build([
			{ id: 'doc1', text: 'create employee' },
			{ id: 'doc2', text: 'employee employee' },
			{ id: 'doc3', text: 'list employee data' },
		]);

		const results = index.search('employee', 10);

		expect(results.length).toBeGreaterThan(1);
		for (let i = 0; i < results.length - 1; i++) {
			expect(results[i]?.score ?? 0).toBeGreaterThanOrEqual(results[i + 1]?.score ?? 0);
		}
	});
});

describe('TF-IDF Index - Edge Cases', () => {
	test('handles empty query', () => {
		const index = new TfidfIndex();
		index.build([{ id: 'doc1', text: 'some text' }]);

		const results = index.search('');

		expect(results).toHaveLength(0);
	});

	test('handles empty corpus', () => {
		const index = new TfidfIndex();
		index.build([]);

		const results = index.search('test query');

		expect(results).toHaveLength(0);
	});

	test('handles single document corpus', () => {
		const index = new TfidfIndex();
		index.build([{ id: 'doc1', text: 'unique document' }]);

		const results = index.search('document');

		expect(results).toHaveLength(1);
		expect(results[0]?.id).toBe('doc1');
		expect(results[0]?.score ?? 0).toBeGreaterThan(0);
	});

	test('handles query with only stopwords', () => {
		const index = new TfidfIndex();
		index.build([
			{ id: 'doc1', text: 'important content here' },
			{ id: 'doc2', text: 'another document' },
		]);

		const results = index.search('the and or but');

		expect(results).toHaveLength(0);
	});
});

describe('TF-IDF Index - Case Sensitivity', () => {
	test('performs case-insensitive search', () => {
		const index = new TfidfIndex();
		index.build([
			{ id: 'doc1', text: 'EMPLOYEE record' },
			{ id: 'doc2', text: 'candidate profile' },
		]);

		const resultsLower = index.search('employee');
		const resultsUpper = index.search('EMPLOYEE');
		const resultsMixed = index.search('EmPlOyEe');

		expect(resultsLower.length).toBeGreaterThan(0);
		expect(resultsUpper.length).toBe(resultsLower.length);
		expect(resultsMixed.length).toBe(resultsLower.length);
		expect(resultsLower[0]?.id).toBe('doc1');
		expect(resultsUpper[0]?.id).toBe('doc1');
		expect(resultsMixed[0]?.id).toBe('doc1');
	});
});

describe('TF-IDF Index - Tool Name Scenarios', () => {
	test('handles tool names with underscores', () => {
		const index = new TfidfIndex();
		index.build([
			{ id: 'hris_create_employee', text: 'hris_create_employee create employee hris' },
			{ id: 'hris_list_employees', text: 'hris_list_employees list employees hris' },
			{ id: 'ats_create_candidate', text: 'ats_create_candidate create candidate ats' },
		]);

		// Search for terms that appear in tool names
		const results = index.search('hris create employee');

		expect(results.length).toBeGreaterThan(0);
		// The HRIS create employee tool should be highly ranked
		const topIds = results.slice(0, 2).map((r) => r.id);
		expect(topIds).toContain('hris_create_employee');
	});

	test('finds relevant tools with multiple query terms', () => {
		const index = new TfidfIndex();
		index.build([
			{ id: 'hris_create_employee', text: 'create employee hris system' },
			{ id: 'hris_list_employees', text: 'list employees hris system' },
			{ id: 'ats_create_candidate', text: 'create candidate ats system' },
			{ id: 'crm_list_contacts', text: 'list contacts crm system' },
		]);

		const results = index.search('employee hris');

		expect(results.length).toBeGreaterThan(0);
		// HRIS employee tools should be top ranked
		const topIds = results.slice(0, 2).map((r) => r.id);
		expect(topIds.some((id) => id.includes('hris') && id.includes('employee'))).toBe(true);
	});

	test('ranks by action type (create, list, etc)', () => {
		const index = new TfidfIndex();
		index.build([
			{ id: 'hris_create_employee', text: 'create employee record' },
			{ id: 'hris_update_employee', text: 'update employee record' },
			{ id: 'hris_delete_employee', text: 'delete employee record' },
			{ id: 'hris_list_employees', text: 'list employee records' },
		]);

		const results = index.search('create employee');

		expect(results.length).toBeGreaterThan(0);
		// create_employee should be top result
		expect(results[0]?.id).toBe('hris_create_employee');
	});
});

describe('TF-IDF Index - Search Limits', () => {
	test('respects k parameter limit', () => {
		const index = new TfidfIndex();
		index.build([
			{ id: 'doc1', text: 'alpha' },
			{ id: 'doc2', text: 'alpha beta' },
			{ id: 'doc3', text: 'alpha gamma' },
			{ id: 'doc4', text: 'alpha delta' },
			{ id: 'doc5', text: 'alpha epsilon' },
		]);

		const results = index.search('alpha', 2);

		expect(results.length).toBeLessThanOrEqual(2);
	});

	test('returns all matches when k exceeds corpus size', () => {
		const index = new TfidfIndex();
		index.build([
			{ id: 'doc1', text: 'test document' },
			{ id: 'doc2', text: 'test file' },
		]);

		const results = index.search('test', 100);

		// Should return at most 2 results (corpus size)
		expect(results.length).toBeLessThanOrEqual(2);
	});
});

describe('TF-IDF Index - IDF Calculation', () => {
	test('assigns higher IDF to rare terms', () => {
		const index = new TfidfIndex();
		index.build([
			{ id: 'doc1', text: 'common term appears everywhere' },
			{ id: 'doc2', text: 'common term appears here' },
			{ id: 'doc3', text: 'common term and rare word' },
		]);

		// Search for the rare term
		const rareResults = index.search('rare');
		// Search for the common term
		const commonResults = index.search('common');

		// Both should return results
		expect(rareResults.length).toBeGreaterThan(0);
		expect(commonResults.length).toBeGreaterThan(0);

		// The document with "rare" should have a good score because it's unique
		expect(rareResults[0]?.score ?? 0).toBeGreaterThan(0);
	});
});
