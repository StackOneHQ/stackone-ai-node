#!/usr/bin/env bun
/**
 * Script to evaluate tool selection accuracy using benchmark dataset
 * 
 * This script uses the current meta-tools implementation to evaluate
 * how well the tool selection mechanism performs on our benchmark dataset.
 */
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { StackOneToolSet } from '../src';

const BENCHMARKS_DIR = join(process.cwd(), 'benchmarks');
const DATA_DIR = join(process.cwd(), 'data');

// Types for benchmark dataset
interface BenchmarkTestCase {
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
    available_functions?: string[];
  };
}

interface BenchmarkDataset {
  version: string;
  generated_at: string;
  description: string;
  statistics: {
    total_test_cases: number;
    total_functions: number;
    functions_per_category: Record<string, number>;
    queries_per_type: Record<string, number>;
    queries_per_difficulty: Record<string, number>;
    models_used: string[];
  };
  splits: {
    train: string[];
    test: string[];
    validation: string[];
  };
  test_cases: BenchmarkTestCase[];
}

// Types for evaluation results
interface SelectionResult {
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

interface EvaluationMetrics {
  total_cases: number;
  successful_predictions: number;
  failed_predictions: number;
  
  // Basic accuracy metrics
  accuracy: number;              // Exact match rate
  top_3_accuracy: number;        // Top-3 accuracy
  top_5_accuracy: number;        // Top-5 accuracy
  
  // Ranking metrics
  mrr: number;                   // Mean Reciprocal Rank
  ndcg_at_5: number;            // Normalized Discounted Cumulative Gain at 5
  
  // Performance metrics
  avg_execution_time_ms: number;
  
  // Detailed breakdowns
  by_category: Record<string, {
    total: number;
    correct: number;
    accuracy: number;
  }>;
  by_difficulty: Record<string, {
    total: number;
    correct: number;
    accuracy: number;
  }>;
  by_query_type: Record<string, {
    total: number;
    correct: number;
    accuracy: number;
  }>;
  by_model: Record<string, {
    total: number;
    correct: number;
    accuracy: number;
  }>;
}

interface EvaluationReport {
  evaluation_info: {
    dataset_version: string;
    evaluated_at: string;
    split_used: string;
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
 * Load benchmark dataset
 */
const loadDataset = async (datasetPath: string): Promise<BenchmarkDataset> => {
  if (!existsSync(datasetPath)) {
    throw new Error(`Dataset not found at ${datasetPath}`);
  }
  
  const content = await readFile(datasetPath, 'utf-8');
  return JSON.parse(content);
};

/**
 * Get test cases for evaluation based on split
 */
const getTestCases = (dataset: BenchmarkDataset, split: 'train' | 'test' | 'validation'): BenchmarkTestCase[] => {
  const splitIds = new Set(dataset.splits[split]);
  return dataset.test_cases.filter(testCase => splitIds.has(testCase.id));
};

/**
 * Evaluate tool selection using meta-tools
 */
const evaluateWithMetaTools = async (testCases: BenchmarkTestCase[]): Promise<SelectionResult[]> => {
  const results: SelectionResult[] = [];
  
  // Initialize StackOne toolset
  const toolset = new StackOneToolSet({ strict: false });
  
  // Get all available tools (we'll use all of them as the function group)
  const allTools = toolset.getStackOneTools('*');
  console.log(`Loaded ${allTools.length} tools for evaluation`);
  
  // Get meta tools for searching
  const metaTools = await allTools.metaTools();
  const searchTool = metaTools.getTool('meta_search_tools');
  
  if (!searchTool) {
    throw new Error('meta_search_tools not found in meta tools');
  }
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const startTime = Date.now();
    
    try {
      console.log(`Evaluating ${i + 1}/${testCases.length}: "${testCase.query.slice(0, 50)}..."`);
      
      // Search for relevant tools
      const searchResult = await searchTool.execute({
        query: testCase.query,
        limit: 10,
        minScore: 0.0, // Get all results to calculate ranking
      });
      
      const executionTime = Date.now() - startTime;
      
      // Parse results
      const tools = searchResult.tools as Array<{
        name: string;
        description: string;
        score: number;
      }>;
      
      if (tools.length === 0) {
        results.push({
          test_case_id: testCase.id,
          query: testCase.query,
          expected_function: testCase.expected_function,
          is_correct: false,
          execution_time_ms: executionTime,
          error: 'No tools returned from search',
        });
        continue;
      }
      
      // Find the expected function in results
      const expectedIndex = tools.findIndex(tool => tool.name === testCase.expected_function);
      const isCorrect = expectedIndex === 0; // Top result is correct
      const rank = expectedIndex >= 0 ? expectedIndex + 1 : -1;
      
      results.push({
        test_case_id: testCase.id,
        query: testCase.query,
        expected_function: testCase.expected_function,
        predicted_function: tools[0]?.name,
        predicted_score: tools[0]?.score,
        predicted_rank: rank,
        is_correct: isCorrect,
        execution_time_ms: executionTime,
      });
      
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
};

/**
 * Calculate evaluation metrics
 */
const calculateMetrics = (results: SelectionResult[], testCases: BenchmarkTestCase[]): EvaluationMetrics => {
  const successful = results.filter(r => !r.error);
  const failed = results.filter(r => r.error);
  const correct = results.filter(r => r.is_correct);
  
  // Basic accuracy
  const accuracy = successful.length > 0 ? correct.length / successful.length : 0;
  
  // Top-K accuracy
  const top3Correct = successful.filter(r => r.predicted_rank && r.predicted_rank <= 3).length;
  const top5Correct = successful.filter(r => r.predicted_rank && r.predicted_rank <= 5).length;
  const top3Accuracy = successful.length > 0 ? top3Correct / successful.length : 0;
  const top5Accuracy = successful.length > 0 ? top5Correct / successful.length : 0;
  
  // Mean Reciprocal Rank
  const reciprocalRanks = successful
    .filter(r => r.predicted_rank && r.predicted_rank > 0)
    .map(r => 1 / r.predicted_rank!);
  const mrr = reciprocalRanks.length > 0 ? reciprocalRanks.reduce((a, b) => a + b, 0) / reciprocalRanks.length : 0;
  
  // NDCG@5 (simplified version)
  const ndcg = successful.reduce((sum, result) => {
    if (!result.predicted_rank || result.predicted_rank > 5) return sum;
    const relevance = result.is_correct ? 1 : 0;
    const discount = Math.log2(result.predicted_rank + 1);
    return sum + relevance / discount;
  }, 0) / successful.length;
  
  // Average execution time
  const avgExecutionTime = results.reduce((sum, r) => sum + r.execution_time_ms, 0) / results.length;
  
  // Create test case lookup
  const testCaseMap = new Map(testCases.map(tc => [tc.id, tc]));
  
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
      breakdown[key].accuracy = breakdown[key].total > 0 ? breakdown[key].correct / breakdown[key].total : 0;
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
    by_category: calculateBreakdown(tc => tc.function_category),
    by_difficulty: calculateBreakdown(tc => tc.difficulty),
    by_query_type: calculateBreakdown(tc => tc.query_type),
    by_model: calculateBreakdown(tc => tc.generated_by),
  };
};

/**
 * Generate failure analysis
 */
const analyzeFailures = (results: SelectionResult[], testCases: BenchmarkTestCase[]) => {
  const testCaseMap = new Map(testCases.map(tc => [tc.id, tc]));
  
  return results
    .filter(r => !r.is_correct || r.error)
    .map(result => {
      const testCase = testCaseMap.get(result.test_case_id)!;
      return {
        query: result.query,
        expected: result.expected_function,
        predicted: result.predicted_function,
        error: result.error,
        category: testCase.function_category,
        difficulty: testCase.difficulty,
      };
    });
};

/**
 * Main function
 */
const main = async (): Promise<void> => {
  const args = process.argv.slice(2);
  const datasetName = args.find(arg => arg.startsWith('--dataset='))?.split('=')[1] || 'benchmark-dataset';
  const split = (args.find(arg => arg.startsWith('--split='))?.split('=')[1] || 'test') as 'train' | 'test' | 'validation';
  const outputName = args.find(arg => arg.startsWith('--output='))?.split('=')[1] || `evaluation-${split}`;
  
  console.log('🧪 Evaluating tool selection accuracy...');
  console.log(`Dataset: ${datasetName}.json`);
  console.log(`Split: ${split}`);
  
  // Load dataset
  const datasetPath = join(BENCHMARKS_DIR, `${datasetName}.json`);
  const dataset = await loadDataset(datasetPath);
  console.log(`Loaded dataset with ${dataset.test_cases.length} total test cases`);
  
  // Get test cases for evaluation
  const testCases = getTestCases(dataset, split);
  console.log(`Selected ${testCases.length} test cases from ${split} split`);
  
  if (testCases.length === 0) {
    throw new Error(`No test cases found for split: ${split}`);
  }
  
  // Evaluate using meta-tools
  console.log('🔍 Running evaluation with meta-tools...');
  const results = await evaluateWithMetaTools(testCases);
  
  // Calculate metrics
  console.log('📊 Calculating metrics...');
  const metrics = calculateMetrics(results, testCases);
  
  // Analyze failures
  console.log('🔍 Analyzing failures...');
  const failureAnalysis = analyzeFailures(results, testCases);
  
  // Create evaluation report
  const report: EvaluationReport = {
    evaluation_info: {
      dataset_version: dataset.version,
      evaluated_at: new Date().toISOString(),
      split_used: split,
      total_test_cases: testCases.length,
      strategy: 'meta-tools-orama-bm25',
    },
    metrics,
    results,
    failure_analysis: failureAnalysis,
  };
  
  // Save report
  const outputPath = join(BENCHMARKS_DIR, `${outputName}-report.json`);
  await writeFile(outputPath, JSON.stringify(report, null, 2));
  
  // Print summary
  console.log('\\n📊 Evaluation Results:');
  console.log(`Strategy: meta-tools (Orama BM25)`);
  console.log(`Test cases: ${metrics.total_cases}`);
  console.log(`Successful predictions: ${metrics.successful_predictions}`);
  console.log(`Failed predictions: ${metrics.failed_predictions}`);
  console.log('\\n🎯 Accuracy Metrics:');
  console.log(`Accuracy: ${(metrics.accuracy * 100).toFixed(2)}%`);
  console.log(`Top-3 Accuracy: ${(metrics.top_3_accuracy * 100).toFixed(2)}%`);
  console.log(`Top-5 Accuracy: ${(metrics.top_5_accuracy * 100).toFixed(2)}%`);
  console.log(`MRR: ${metrics.mrr.toFixed(4)}`);
  console.log(`NDCG@5: ${metrics.ndcg_at_5.toFixed(4)}`);
  console.log(`Avg execution time: ${metrics.avg_execution_time_ms.toFixed(2)}ms`);
  
  console.log('\\n📈 By Category:');
  for (const [category, stats] of Object.entries(metrics.by_category)) {
    console.log(`  ${category}: ${(stats.accuracy * 100).toFixed(1)}% (${stats.correct}/${stats.total})`);
  }
  
  console.log('\\n📊 By Difficulty:');
  for (const [difficulty, stats] of Object.entries(metrics.by_difficulty)) {
    console.log(`  ${difficulty}: ${(stats.accuracy * 100).toFixed(1)}% (${stats.correct}/${stats.total})`);
  }
  
  if (failureAnalysis.length > 0) {
    console.log(`\\n❌ Failure Examples (showing first 5 of ${failureAnalysis.length}):`);
    failureAnalysis.slice(0, 5).forEach((failure, i) => {
      console.log(`  ${i + 1}. "${failure.query.slice(0, 60)}..."`);
      console.log(`     Expected: ${failure.expected}`);
      console.log(`     Got: ${failure.predicted || 'N/A'}`);
      if (failure.error) {
        console.log(`     Error: ${failure.error}`);
      }
    });
  }
  
  console.log(`\\n✅ Full report saved to: ${outputPath}`);
};

// Run the main function
if (import.meta.main) {
  main().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
}