/**
 * Utility functions for benchmark dataset creation and management
 */
import type { BenchmarkTestCase } from './evaluate';

export interface BenchmarkDataset {
  info: {
    created_at: string;
    total_cases: number;
    train_cases: number;
    test_cases: number;
    validation_cases: number;
  };
  train: BenchmarkTestCase[];
  test: BenchmarkTestCase[];
  validation: BenchmarkTestCase[];
}

/**
 * Create a structured benchmark dataset from test cases
 *
 * @param testCases Array of test cases to split
 * @param splits Split ratios as [train, test, validation] (default: [0.7, 0.2, 0.1])
 * @returns Structured benchmark dataset
 */
export function createBenchmarkDataset(
  testCases: BenchmarkTestCase[],
  splits: [number, number, number] = [0.7, 0.2, 0.1]
): BenchmarkDataset {
  // Validate splits
  const [trainRatio, testRatio, validationRatio] = splits;
  const totalRatio = trainRatio + testRatio + validationRatio;
  if (Math.abs(totalRatio - 1.0) > 0.001) {
    throw new Error(`Split ratios must sum to 1.0, got ${totalRatio}`);
  }

  const { train, test, validation } = splitTestCases(testCases, splits);

  return {
    info: {
      created_at: new Date().toISOString(),
      total_cases: testCases.length,
      train_cases: train.length,
      test_cases: test.length,
      validation_cases: validation.length,
    },
    train,
    test,
    validation,
  };
}

/**
 * Split test cases into train/test/validation sets
 *
 * @param testCases Array of test cases to split
 * @param splits Split ratios as [train, test, validation] (default: [0.7, 0.2, 0.1])
 * @returns Object with train, test, and validation arrays
 */
export function splitTestCases(
  testCases: BenchmarkTestCase[],
  splits: [number, number, number] = [0.7, 0.2, 0.1]
): { train: BenchmarkTestCase[]; test: BenchmarkTestCase[]; validation: BenchmarkTestCase[] } {
  const [trainRatio, testRatio, _validationRatio] = splits;

  // Shuffle test cases for random distribution
  const shuffled = [...testCases].sort(() => Math.random() - 0.5);

  const totalCases = shuffled.length;
  const trainCount = Math.floor(totalCases * trainRatio);
  const testCount = Math.floor(totalCases * testRatio);
  const _validationCount = totalCases - trainCount - testCount; // Remaining cases

  return {
    train: shuffled.slice(0, trainCount),
    test: shuffled.slice(trainCount, trainCount + testCount),
    validation: shuffled.slice(trainCount + testCount),
  };
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Group test cases by a specific property
 */
export function groupTestCasesBy<K extends keyof BenchmarkTestCase>(
  testCases: BenchmarkTestCase[],
  property: K
): Record<string, BenchmarkTestCase[]> {
  return testCases.reduce(
    (groups, testCase) => {
      const key = String(testCase[property]);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(testCase);
      return groups;
    },
    {} as Record<string, BenchmarkTestCase[]>
  );
}

/**
 * Calculate basic statistics for test cases
 */
export function calculateDatasetStats(testCases: BenchmarkTestCase[]) {
  const byCategory = groupTestCasesBy(testCases, 'function_category');
  const byDifficulty = groupTestCasesBy(testCases, 'difficulty');
  const byQueryType = groupTestCasesBy(testCases, 'query_type');

  return {
    total_cases: testCases.length,
    unique_functions: new Set(testCases.map((tc) => tc.expected_function)).size,
    categories: Object.entries(byCategory).map(([category, cases]) => ({
      category,
      count: cases.length,
      percentage: ((cases.length / testCases.length) * 100).toFixed(1),
    })),
    difficulties: Object.entries(byDifficulty).map(([difficulty, cases]) => ({
      difficulty,
      count: cases.length,
      percentage: ((cases.length / testCases.length) * 100).toFixed(1),
    })),
    query_types: Object.entries(byQueryType).map(([type, cases]) => ({
      type,
      count: cases.length,
      percentage: ((cases.length / testCases.length) * 100).toFixed(1),
    })),
  };
}
