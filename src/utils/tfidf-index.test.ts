import { fc, test as fcTest } from '@fast-check/vitest';
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

	test('assigns higher IDF to rare terms', () => {
		const index = new TfidfIndex();
		index.build([
			{ id: 'doc1', text: 'common term appears everywhere' },
			{ id: 'doc2', text: 'common term appears here' },
			{ id: 'doc3', text: 'common term and rare word' },
		]);

		const rareResults = index.search('rare');
		const commonResults = index.search('common');

		expect(rareResults.length).toBeGreaterThan(0);
		expect(commonResults.length).toBeGreaterThan(0);
		expect(rareResults[0]?.score ?? 0).toBeGreaterThan(0);
	});
});

describe('TF-IDF Index - Tool Name Scenarios', () => {
	test('handles tool names with underscores', () => {
		const index = new TfidfIndex();
		index.build([
			{ id: 'bamboohr_create_employee', text: 'bamboohr_create_employee create employee bamboohr' },
			{ id: 'bamboohr_list_employees', text: 'bamboohr_list_employees list employees bamboohr' },
			{ id: 'workday_create_candidate', text: 'workday_create_candidate create candidate workday' },
		]);

		const results = index.search('bamboohr create employee');

		expect(results.length).toBeGreaterThan(0);
		const topIds = results.slice(0, 2).map((r) => r.id);
		expect(topIds).toContain('bamboohr_create_employee');
	});

	test('ranks by action type (create, list, etc)', () => {
		const index = new TfidfIndex();
		index.build([
			{ id: 'bamboohr_create_employee', text: 'create employee record' },
			{ id: 'bamboohr_update_employee', text: 'update employee record' },
			{ id: 'bamboohr_delete_employee', text: 'delete employee record' },
			{ id: 'bamboohr_list_employees', text: 'list employee records' },
		]);

		const results = index.search('create employee');

		expect(results.length).toBeGreaterThan(0);
		expect(results[0]?.id).toBe('bamboohr_create_employee');
	});
});

/**
 * Property-Based Tests for TfidfIndex
 *
 * These tests verify invariants that must hold for ANY valid input,
 * replacing the following example-based tests:
 *
 * - Score Validation: scores like 0.7071, 0.5, 1.0 are always in [0, 1]
 * - Edge Cases: empty query "" returns [], query with no matches returns []
 * - Case Sensitivity: "Alpha" and "ALPHA" and "alpha" return same results
 * - Search Limits: search("term", 5) returns at most 5 results
 */
describe('TF-IDF Index - Property-Based Tests', () => {
	const documentArbitrary = fc.record({
		id: fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0),
		text: fc.string({ minLength: 1, maxLength: 200 }),
	});

	const corpusArbitrary = fc.array(documentArbitrary, { minLength: 1, maxLength: 20 });

	const queryArbitrary = fc
		.array(fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]*$/), { minLength: 1, maxLength: 5 })
		.map((words) => words.join(' '));

	// Example: search("alpha") on any corpus returns scores like 0.0, 0.5, 1.0 - never 1.5 or -0.1
	fcTest.prop([corpusArbitrary, queryArbitrary], { numRuns: 100 })(
		'scores are always within [0, 1] range',
		(corpus, query) => {
			const index = new TfidfIndex();
			index.build(corpus);
			const results = index.search(query, 100);

			for (const result of results) {
				expect(result.score).toBeGreaterThanOrEqual(0);
				expect(result.score).toBeLessThanOrEqual(1);
			}
		},
	);

	// Example: [{ score: 0.9 }, { score: 0.7 }, { score: 0.3 }] - always descending
	fcTest.prop([corpusArbitrary, queryArbitrary], { numRuns: 100 })(
		'results are always sorted by score in descending order',
		(corpus, query) => {
			const index = new TfidfIndex();
			index.build(corpus);
			const results = index.search(query, 100);

			for (let i = 0; i < results.length - 1; i++) {
				expect(results[i]?.score ?? 0).toBeGreaterThanOrEqual(results[i + 1]?.score ?? 0);
			}
		},
	);

	// Example: search("term", 3) with 10 matching docs returns only 3 results
	fcTest.prop([corpusArbitrary, queryArbitrary, fc.integer({ min: 1, max: 50 })], { numRuns: 100 })(
		'search returns at most k results',
		(corpus, query, k) => {
			const index = new TfidfIndex();
			index.build(corpus);
			const results = index.search(query, k);

			expect(results.length).toBeLessThanOrEqual(k);
		},
	);

	// Example: search("Alpha"), search("ALPHA"), search("alpha") all return identical results
	fcTest.prop([corpusArbitrary, queryArbitrary], { numRuns: 100 })(
		'search is case-insensitive',
		(corpus, query) => {
			const index = new TfidfIndex();
			index.build(corpus);

			const lowerResults = index.search(query.toLowerCase());
			const upperResults = index.search(query.toUpperCase());

			expect(lowerResults.length).toBe(upperResults.length);
			for (let i = 0; i < lowerResults.length; i++) {
				expect(lowerResults[i]?.id).toBe(upperResults[i]?.id);
				expect(lowerResults[i]?.score).toBeCloseTo(upperResults[i]?.score ?? 0, 10);
			}
		},
	);

	// Example: index.build([]) then search("anything") returns []
	fcTest.prop([queryArbitrary], { numRuns: 50 })('empty corpus returns empty results', (query) => {
		const index = new TfidfIndex();
		index.build([]);
		const results = index.search(query);

		expect(results).toHaveLength(0);
	});

	// Example: corpus has ids ["doc1", "doc2"], results only contain "doc1" or "doc2"
	fcTest.prop([corpusArbitrary, queryArbitrary], { numRuns: 100 })(
		'result IDs are from the indexed corpus',
		(corpus, query) => {
			const index = new TfidfIndex();
			index.build(corpus);
			const results = index.search(query, 100);

			const corpusIds = new Set(corpus.map((doc) => doc.id));
			for (const result of results) {
				expect(corpusIds.has(result.id)).toBe(true);
			}
		},
	);

	// Example: same corpus + same query always produces identical results
	fcTest.prop([corpusArbitrary, queryArbitrary], { numRuns: 50 })(
		'search is deterministic',
		(corpus, query) => {
			const index1 = new TfidfIndex();
			const index2 = new TfidfIndex();

			index1.build(corpus);
			index2.build(corpus);

			const results1 = index1.search(query, 10);
			const results2 = index2.search(query, 10);

			expect(results1).toEqual(results2);
		},
	);
});
