import { expect, test } from 'bun:test';
import { TfidfIndex } from './tfidf-index';

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
