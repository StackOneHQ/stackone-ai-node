#!/usr/bin/env bun
/**
 * Script to run comparison between different tool selection strategies
 * 
 * This script evaluates multiple strategies on the same benchmark dataset
 * and generates a comparative analysis report.
 */
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ToolSelectionStrategy } from './strategies/base-strategy';
import { OramaBM25Strategy } from './strategies/orama-strategy';
import { KeywordMatchingStrategy } from './strategies/keyword-strategy';
import { AIDirectSelectionStrategy } from './strategies/ai-strategy';

const BENCHMARKS_DIR = join(process.cwd(), 'benchmarks');

// Types for benchmark dataset (reuse from evaluate-selection.ts)
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

interface StrategyResult {
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

interface StrategyMetrics {
  strategy_name: string;
  total_cases: number;
  successful_predictions: number;
  failed_predictions: number;
  accuracy: number;
  top_3_accuracy: number;
  top_5_accuracy: number;
  mrr: number;
  avg_execution_time_ms: number;
  by_category: Record<string, { total: number; correct: number; accuracy: number }>;
  by_difficulty: Record<string, { total: number; correct: number; accuracy: number }>;
}

interface ComparisonReport {
  comparison_info: {
    dataset_version: string;
    evaluated_at: string;
    split_used: string;
    total_test_cases: number;
    strategies_compared: string[];
  };
  strategy_metrics: StrategyMetrics[];
  detailed_results: Record<string, StrategyResult[]>;
  head_to_head_comparison: Array<{
    test_case_id: string;
    query: string;
    expected_function: string;
    category: string;
    difficulty: string;
    results_by_strategy: Record<string, {
      predicted: string | null;
      score?: number;
      rank?: number;
      correct: boolean;
      time_ms: number;
    }>;
  }>;
  winner_analysis: {
    overall_winner: string;
    category_winners: Record<string, string>;
    difficulty_winners: Record<string, string>;
    speed_winner: string;
  };
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
 * Evaluate a single strategy
 */
const evaluateStrategy = async (
  strategy: ToolSelectionStrategy,
  testCases: BenchmarkTestCase[]
): Promise<StrategyResult[]> => {
  const results: StrategyResult[] = [];
  
  console.log(`\\n🧪 Evaluating ${strategy.name} strategy...`);
  
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
      const expectedIndex = selections.findIndex(sel => sel.name === testCase.expected_function);
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
        const progress = ((i + 1) / testCases.length * 100).toFixed(1);
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
};

/**
 * Calculate metrics for a strategy
 */
const calculateMetrics = (
  strategyName: string,
  results: StrategyResult[],
  testCases: BenchmarkTestCase[]
): StrategyMetrics => {
  const successful = results.filter(r => !r.error);
  const failed = results.filter(r => r.error);
  const correct = results.filter(r => r.is_correct);
  
  const accuracy = successful.length > 0 ? correct.length / successful.length : 0;
  
  const top3Correct = successful.filter(r => r.predicted_rank && r.predicted_rank <= 3).length;
  const top5Correct = successful.filter(r => r.predicted_rank && r.predicted_rank <= 5).length;
  const top3Accuracy = successful.length > 0 ? top3Correct / successful.length : 0;
  const top5Accuracy = successful.length > 0 ? top5Correct / successful.length : 0;
  
  const reciprocalRanks = successful
    .filter(r => r.predicted_rank && r.predicted_rank > 0)
    .map(r => 1 / r.predicted_rank!);
  const mrr = reciprocalRanks.length > 0 ? reciprocalRanks.reduce((a, b) => a + b, 0) / reciprocalRanks.length : 0;
  
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
    
    for (const key of Object.keys(breakdown)) {
      breakdown[key].accuracy = breakdown[key].total > 0 ? breakdown[key].correct / breakdown[key].total : 0;
    }
    
    return breakdown;
  };
  
  return {
    strategy_name: strategyName,
    total_cases: results.length,
    successful_predictions: successful.length,
    failed_predictions: failed.length,
    accuracy,
    top_3_accuracy: top3Accuracy,
    top_5_accuracy: top5Accuracy,
    mrr,
    avg_execution_time_ms: avgExecutionTime,
    by_category: calculateBreakdown(tc => tc.function_category),
    by_difficulty: calculateBreakdown(tc => tc.difficulty),
  };
};

/**
 * Create head-to-head comparison
 */
const createHeadToHeadComparison = (
  testCases: BenchmarkTestCase[],
  resultsByStrategy: Record<string, StrategyResult[]>
): ComparisonReport['head_to_head_comparison'] => {
  const comparison: ComparisonReport['head_to_head_comparison'] = [];
  
  for (const testCase of testCases) {
    const comparisonItem = {
      test_case_id: testCase.id,
      query: testCase.query,
      expected_function: testCase.expected_function,
      category: testCase.function_category,
      difficulty: testCase.difficulty,
      results_by_strategy: {} as Record<string, any>,
    };
    
    for (const [strategyName, results] of Object.entries(resultsByStrategy)) {
      const result = results.find(r => r.test_case_id === testCase.id);
      if (result) {
        comparisonItem.results_by_strategy[strategyName] = {
          predicted: result.predicted_function || null,
          score: result.predicted_score,
          rank: result.predicted_rank,
          correct: result.is_correct,
          time_ms: result.execution_time_ms,
        };
      }
    }
    
    comparison.push(comparisonItem);
  }
  
  return comparison;
};

/**
 * Analyze winners
 */
const analyzeWinners = (metrics: StrategyMetrics[]): ComparisonReport['winner_analysis'] => {
  // Overall winner by accuracy
  const overallWinner = metrics.reduce((best, current) => 
    current.accuracy > best.accuracy ? current : best
  ).strategy_name;
  
  // Category winners
  const categoryWinners: Record<string, string> = {};
  const categories = new Set<string>();
  metrics.forEach(m => Object.keys(m.by_category).forEach(cat => categories.add(cat)));
  
  for (const category of categories) {
    let bestAccuracy = -1;
    let winner = '';
    
    for (const metric of metrics) {
      const categoryMetric = metric.by_category[category];
      if (categoryMetric && categoryMetric.accuracy > bestAccuracy) {
        bestAccuracy = categoryMetric.accuracy;
        winner = metric.strategy_name;
      }
    }
    
    categoryWinners[category] = winner;
  }
  
  // Difficulty winners
  const difficultyWinners: Record<string, string> = {};
  const difficulties = ['easy', 'medium', 'hard'];
  
  for (const difficulty of difficulties) {
    let bestAccuracy = -1;
    let winner = '';
    
    for (const metric of metrics) {
      const difficultyMetric = metric.by_difficulty[difficulty];
      if (difficultyMetric && difficultyMetric.accuracy > bestAccuracy) {
        bestAccuracy = difficultyMetric.accuracy;
        winner = metric.strategy_name;
      }
    }
    
    difficultyWinners[difficulty] = winner;
  }
  
  // Speed winner
  const speedWinner = metrics.reduce((fastest, current) =>
    current.avg_execution_time_ms < fastest.avg_execution_time_ms ? current : fastest
  ).strategy_name;
  
  return {
    overall_winner: overallWinner,
    category_winners: categoryWinners,
    difficulty_winners: difficultyWinners,
    speed_winner: speedWinner,
  };
};

/**
 * Main function
 */
const main = async (): Promise<void> => {
  const args = process.argv.slice(2);
  const datasetName = args.find(arg => arg.startsWith('--dataset='))?.split('=')[1] || 'benchmark-dataset';
  const split = (args.find(arg => arg.startsWith('--split='))?.split('=')[1] || 'test') as 'train' | 'test' | 'validation';
  const outputName = args.find(arg => arg.startsWith('--output='))?.split('=')[1] || `comparison-${split}`;
  const strategiesArg = args.find(arg => arg.startsWith('--strategies='))?.split('=')[1] || 'orama,keyword';
  const aiModel = args.find(arg => arg.startsWith('--ai-model='))?.split('=')[1] || 'gemma3:4b';
  
  console.log('🏁 Running strategy comparison...');
  console.log(`Dataset: ${datasetName}.json`);
  console.log(`Split: ${split}`);
  console.log(`Strategies: ${strategiesArg}`);
  
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
  
  // Initialize strategies
  const strategies: ToolSelectionStrategy[] = [];
  const requestedStrategies = strategiesArg.split(',');
  
  for (const strategyName of requestedStrategies) {
    switch (strategyName.trim()) {
      case 'orama':
        strategies.push(new OramaBM25Strategy());
        break;
      case 'keyword':
        strategies.push(new KeywordMatchingStrategy());
        break;
      case 'ai':
        strategies.push(new AIDirectSelectionStrategy(aiModel));
        break;
      default:
        console.warn(`Unknown strategy: ${strategyName}`);
    }
  }
  
  if (strategies.length === 0) {
    throw new Error('No valid strategies specified');
  }
  
  console.log(`Initialized ${strategies.length} strategies`);
  
  // Evaluate all strategies
  const resultsByStrategy: Record<string, StrategyResult[]> = {};
  const allMetrics: StrategyMetrics[] = [];
  
  for (const strategy of strategies) {
    try {
      const results = await evaluateStrategy(strategy, testCases);
      const metrics = calculateMetrics(strategy.name, results, testCases);
      
      resultsByStrategy[strategy.name] = results;
      allMetrics.push(metrics);
      
      console.log(`✅ ${strategy.name}: ${(metrics.accuracy * 100).toFixed(1)}% accuracy`);
      
      // Cleanup strategy
      if (strategy.cleanup) {
        await strategy.cleanup();
      }
    } catch (error) {
      console.error(`❌ Error evaluating ${strategy.name}:`, error);
    }
  }
  
  if (allMetrics.length === 0) {
    throw new Error('No strategies completed successfully');
  }
  
  // Create comparison report
  console.log('\\n📊 Generating comparison report...');
  
  const headToHeadComparison = createHeadToHeadComparison(testCases, resultsByStrategy);
  const winnerAnalysis = analyzeWinners(allMetrics);
  
  const report: ComparisonReport = {
    comparison_info: {
      dataset_version: dataset.version,
      evaluated_at: new Date().toISOString(),
      split_used: split,
      total_test_cases: testCases.length,
      strategies_compared: Object.keys(resultsByStrategy),
    },
    strategy_metrics: allMetrics,
    detailed_results: resultsByStrategy,
    head_to_head_comparison: headToHeadComparison,
    winner_analysis: winnerAnalysis,
  };
  
  // Save report
  const outputPath = join(BENCHMARKS_DIR, `${outputName}-comparison.json`);
  await writeFile(outputPath, JSON.stringify(report, null, 2));
  
  // Print summary
  console.log('\\n🏆 Comparison Results:');
  console.log(`Overall Winner: ${winnerAnalysis.overall_winner}`);
  console.log(`Speed Winner: ${winnerAnalysis.speed_winner}`);
  
  console.log('\\n📊 Strategy Performance:');
  for (const metrics of allMetrics) {
    console.log(`\\n${metrics.strategy_name}:`);
    console.log(`  Accuracy: ${(metrics.accuracy * 100).toFixed(1)}%`);
    console.log(`  Top-3: ${(metrics.top_3_accuracy * 100).toFixed(1)}%`);
    console.log(`  MRR: ${metrics.mrr.toFixed(3)}`);
    console.log(`  Avg time: ${metrics.avg_execution_time_ms.toFixed(1)}ms`);
  }
  
  console.log('\\n🏆 Category Winners:');
  for (const [category, winner] of Object.entries(winnerAnalysis.category_winners)) {
    console.log(`  ${category}: ${winner}`);
  }
  
  console.log('\\n🎯 Difficulty Winners:');
  for (const [difficulty, winner] of Object.entries(winnerAnalysis.difficulty_winners)) {
    console.log(`  ${difficulty}: ${winner}`);
  }
  
  console.log(`\\n✅ Full comparison report saved to: ${outputPath}`);
};

// Run the main function
if (import.meta.main) {
  main().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
}