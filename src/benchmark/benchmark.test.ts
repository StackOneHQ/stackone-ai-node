/**
 * Tests for benchmark system
 */
import { describe, expect, test } from 'bun:test';
import { StackOneMetaToolsStrategy } from './evaluate';
import { extractStackOneFunctions } from './extract-functions';
import { generateQueriesForFunction } from './generate-queries';

describe('Benchmark System', () => {
  test('should extract StackOne functions', () => {
    const catalog = extractStackOneFunctions();

    expect(catalog).toHaveProperty('functions');
    expect(catalog).toHaveProperty('total_functions');
    expect(catalog).toHaveProperty('categories');
    expect(catalog.functions.length).toBeGreaterThan(0);
    expect(catalog.total_functions).toBe(catalog.functions.length);

    // Check function structure
    const firstFunction = catalog.functions[0];
    expect(firstFunction).toHaveProperty('name');
    expect(firstFunction).toHaveProperty('category');
    expect(firstFunction).toHaveProperty('action');
    expect(firstFunction).toHaveProperty('entity');
    expect(firstFunction).toHaveProperty('description');
    expect(firstFunction).toHaveProperty('method');
    expect(firstFunction).toHaveProperty('path');
    expect(firstFunction).toHaveProperty('parameters');
    expect(firstFunction).toHaveProperty('complexity');
  });

  test('should create StackOne meta-tools strategy', () => {
    const strategy = new StackOneMetaToolsStrategy();

    expect(strategy.name).toBe('stackone-meta-tools');
    expect(strategy.description).toBe('StackOne SDK meta-tools with Orama BM25 algorithm');
  });

  test('should generate fallback queries for function', async () => {
    const catalog = extractStackOneFunctions();
    const testFunction =
      catalog.functions.find((f) => f.name === 'hris_list_employees') || catalog.functions[0];

    // Test with a model that will likely fail to force fallback
    const queries = await generateQueriesForFunction(testFunction, 'invalid-model');

    expect(queries).toBeArray();
    expect(queries.length).toBeGreaterThan(0);

    // Check query structure
    const firstQuery = queries[0];
    expect(firstQuery).toHaveProperty('query');
    expect(firstQuery).toHaveProperty('type');
    expect(firstQuery).toHaveProperty('difficulty');
    expect(['easy', 'medium', 'hard']).toContain(firstQuery.difficulty);
  });
});
