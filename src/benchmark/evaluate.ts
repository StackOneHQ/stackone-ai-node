/**
 * Evaluation utilities for tool selection benchmarking
 *
 * This module can be imported and used in other repositories to evaluate
 * tool selection accuracy using the StackOne SDK.
 */
import { StackOneToolSet } from '../toolsets/stackone';

// Evaluation types
export interface ToolSelectionResult {
  name: string;
  description: string;
  score: number;
}

export interface BenchmarkTestCase {
  id: string;
  query: string;
  expected_function: string;
  function_category: string;
  query_type: string;
  difficulty: 'easy' | 'medium' | 'hard';
  generated_by: string;
  generation_time: string;
  metadata: {
    function_action: string;
    function_entity: string;
    function_complexity: number;
  };
}

export interface SelectionResult {
  test_case_id: string;
  query: string;
  expected_function: string;
  predicted_function?: string;
  predicted_score?: number;
  predicted_rank?: number;
  is_correct: boolean;
  execution_time_ms: number;
  error?: string;
}

export interface EvaluationMetrics {
  total_cases: number;
  successful_predictions: number;
  failed_predictions: number;

  // Basic accuracy metrics
  accuracy: number;
  top_3_accuracy: number;
  top_5_accuracy: number;

  // Ranking metrics
  mrr: number;
  ndcg_at_5: number;

  // Performance metrics
  avg_execution_time_ms: number;

  // Detailed breakdowns
  by_category: Record<
    string,
    {
      total: number;
      correct: number;
      accuracy: number;
    }
  >;
  by_difficulty: Record<
    string,
    {
      total: number;
      correct: number;
      accuracy: number;
    }
  >;
}

export interface EvaluationReport {
  evaluation_info: {
    evaluated_at: string;
    total_test_cases: number;
    strategy: string;
  };
  metrics: EvaluationMetrics;
  results: SelectionResult[];
  failure_analysis: Array<{
    query: string;
    expected: string;
    predicted?: string;
    error?: string;
    category: string;
    difficulty: string;
  }>;
}

/**
 * Tool selection strategy interface
 */
export interface ToolSelectionStrategy {
  name: string;
  description: string;

  select(query: string, availableTools?: string[], limit?: number): Promise<ToolSelectionResult[]>;

  cleanup?(): Promise<void>;
}

/**
 * StackOne meta-tools strategy using the current Orama BM25 implementation
 */
export class StackOneMetaToolsStrategy implements ToolSelectionStrategy {
  name = 'stackone-meta-tools';
  description = 'StackOne SDK meta-tools with Orama BM25 algorithm';

  private toolset: StackOneToolSet;
  private metaTools:
    | { getTool: (name: string) => { execute: (params: any) => Promise<any> } }
    | undefined;
  private searchTool:
    | {
        execute: (params: { query: string; limit: number; minScore: number }) => Promise<{
          tools: Array<{ name: string; description: string; score: number }>;
        }>;
      }
    | undefined;

  constructor() {
    this.toolset = new StackOneToolSet({ strict: false });
  }

  async initialize(): Promise<void> {
    if (!this.searchTool) {
      const allTools = this.toolset.getStackOneTools('*');
      this.metaTools = await allTools.metaTools();
      this.searchTool = this.metaTools.getTool('meta_search_tools');

      if (!this.searchTool) {
        throw new Error('meta_search_tools not found');
      }
    }
  }

  async select(
    query: string,
    availableTools?: string[],
    limit = 10
  ): Promise<ToolSelectionResult[]> {
    await this.initialize();

    try {
      const searchResult = await this.searchTool.execute({
        query,
        limit,
        minScore: 0.0,
      });

      const tools = searchResult.tools as Array<{
        name: string;
        description: string;
        score: number;
      }>;

      // Filter by available tools if specified
      const filteredTools = availableTools
        ? tools.filter((tool) => availableTools.includes(tool.name))
        : tools;

      return filteredTools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        score: tool.score,
      }));
    } catch (error) {
      console.error('StackOneMetaToolsStrategy selection error:', error);
      return [];
    }
  }

  async cleanup(): Promise<void> {
    // No cleanup needed for meta-tools strategy
  }
}

/**
 * Evaluate tool selection using a strategy
 */
export async function evaluateStrategy(
  strategy: ToolSelectionStrategy,
  testCases: BenchmarkTestCase[]
): Promise<SelectionResult[]> {
  const results: SelectionResult[] = [];

  console.log(`\n🧪 Evaluating ${strategy.name} strategy on ${testCases.length} test cases...`);

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const startTime = Date.now();

    try {
      const selections = await strategy.select(testCase.query, undefined, 10);
      const executionTime = Date.now() - startTime;

      if (selections.length === 0) {
        results.push({
          test_case_id: testCase.id,
          query: testCase.query,
          expected_function: testCase.expected_function,
          is_correct: false,
          execution_time_ms: executionTime,
          error: 'No results returned',
        });
        continue;
      }

      // Find the expected function in results
      const expectedIndex = selections.findIndex((sel) => sel.name === testCase.expected_function);
      const isCorrect = expectedIndex === 0;
      const rank = expectedIndex >= 0 ? expectedIndex + 1 : -1;

      results.push({
        test_case_id: testCase.id,
        query: testCase.query,
        expected_function: testCase.expected_function,
        predicted_function: selections[0]?.name,
        predicted_score: selections[0]?.score,
        predicted_rank: rank,
        is_correct: isCorrect,
        execution_time_ms: executionTime,
      });

      if ((i + 1) % 10 === 0 || i === testCases.length - 1) {
        const progress = (((i + 1) / testCases.length) * 100).toFixed(1);
        console.log(`  Progress: ${i + 1}/${testCases.length} (${progress}%)`);
      }
    } catch (error) {
      const executionTime = Date.now() - startTime;
      results.push({
        test_case_id: testCase.id,
        query: testCase.query,
        expected_function: testCase.expected_function,
        is_correct: false,
        execution_time_ms: executionTime,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return results;
}

/**
 * Calculate evaluation metrics from results
 */
export function calculateMetrics(
  results: SelectionResult[],
  testCases: BenchmarkTestCase[]
): EvaluationMetrics {
  const successful = results.filter((r) => !r.error);
  const failed = results.filter((r) => r.error);
  const correct = results.filter((r) => r.is_correct);

  // Basic accuracy
  const accuracy = successful.length > 0 ? correct.length / successful.length : 0;

  // Top-K accuracy
  const top3Correct = successful.filter((r) => r.predicted_rank && r.predicted_rank <= 3).length;
  const top5Correct = successful.filter((r) => r.predicted_rank && r.predicted_rank <= 5).length;
  const top3Accuracy = successful.length > 0 ? top3Correct / successful.length : 0;
  const top5Accuracy = successful.length > 0 ? top5Correct / successful.length : 0;

  // Mean Reciprocal Rank
  const reciprocalRanks = successful
    .filter((r) => r.predicted_rank && r.predicted_rank > 0)
    .map((r) => 1 / (r.predicted_rank ?? 1));
  const mrr =
    reciprocalRanks.length > 0
      ? reciprocalRanks.reduce((a, b) => a + b, 0) / reciprocalRanks.length
      : 0;

  // NDCG@5 (simplified version)
  const ndcg =
    successful.reduce((sum, result) => {
      if (!result.predicted_rank || result.predicted_rank > 5) return sum;
      const relevance = result.is_correct ? 1 : 0;
      const discount = Math.log2(result.predicted_rank + 1);
      return sum + relevance / discount;
    }, 0) / successful.length;

  // Average execution time
  const avgExecutionTime =
    results.reduce((sum, r) => sum + r.execution_time_ms, 0) / results.length;

  // Create test case lookup
  const testCaseMap = new Map(testCases.map((tc) => [tc.id, tc]));

  // Calculate breakdowns
  const calculateBreakdown = (groupBy: (tc: BenchmarkTestCase) => string) => {
    const breakdown: Record<string, { total: number; correct: number; accuracy: number }> = {};

    for (const result of successful) {
      const testCase = testCaseMap.get(result.test_case_id);
      if (!testCase) continue;

      const key = groupBy(testCase);
      if (!breakdown[key]) {
        breakdown[key] = { total: 0, correct: 0, accuracy: 0 };
      }

      breakdown[key].total++;
      if (result.is_correct) {
        breakdown[key].correct++;
      }
    }

    // Calculate accuracy for each group
    for (const key of Object.keys(breakdown)) {
      breakdown[key].accuracy =
        breakdown[key].total > 0 ? breakdown[key].correct / breakdown[key].total : 0;
    }

    return breakdown;
  };

  return {
    total_cases: results.length,
    successful_predictions: successful.length,
    failed_predictions: failed.length,
    accuracy,
    top_3_accuracy: top3Accuracy,
    top_5_accuracy: top5Accuracy,
    mrr,
    ndcg_at_5: ndcg,
    avg_execution_time_ms: avgExecutionTime,
    by_category: calculateBreakdown((tc) => tc.function_category),
    by_difficulty: calculateBreakdown((tc) => tc.difficulty),
  };
}

/**
 * Generate failure analysis
 */
export function analyzeFailures(
  results: SelectionResult[],
  testCases: BenchmarkTestCase[]
): EvaluationReport['failure_analysis'] {
  const testCaseMap = new Map(testCases.map((tc) => [tc.id, tc]));

  return results
    .filter((r) => !r.is_correct || r.error)
    .map((result) => {
      const testCase = testCaseMap.get(result.test_case_id);
      if (!testCase) throw new Error(`Test case not found: ${result.test_case_id}`);
      return {
        query: result.query,
        expected: result.expected_function,
        predicted: result.predicted_function,
        error: result.error,
        category: testCase.function_category,
        difficulty: testCase.difficulty,
      };
    });
}

/**
 * Complete evaluation workflow
 */
export async function runEvaluation(
  strategy: ToolSelectionStrategy,
  testCases: BenchmarkTestCase[]
): Promise<EvaluationReport> {
  // Evaluate strategy
  const results = await evaluateStrategy(strategy, testCases);

  // Calculate metrics
  const metrics = calculateMetrics(results, testCases);

  // Analyze failures
  const failureAnalysis = analyzeFailures(results, testCases);

  // Clean up strategy
  if (strategy.cleanup) {
    await strategy.cleanup();
  }

  return {
    evaluation_info: {
      evaluated_at: new Date().toISOString(),
      total_test_cases: testCases.length,
      strategy: strategy.name,
    },
    metrics,
    results,
    failure_analysis: failureAnalysis,
  };
}
