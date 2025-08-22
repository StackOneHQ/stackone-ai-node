/**
 * StackOne AI SDK Benchmark Utilities
 *
 * This module provides reusable components for benchmarking tool selection
 * systems in external repositories using the StackOne AI SDK.
 *
 * @example Basic usage in another repository:
 * ```typescript
 * import {
 *   extractStackOneFunctions,
 *   generateQueryDataset,
 *   runEvaluation,
 *   StackOneMetaToolsStrategy
 * } from '@stackone/ai/benchmark';
 *
 * // 1. Extract all StackOne functions
 * const catalog = extractStackOneFunctions();
 *
 * // 2. Generate test queries
 * const queries = await generateQueryDataset(catalog.functions, {
 *   model: 'gpt-4o-mini',
 *   limit: 10
 * });
 *
 * // 3. Create test cases (manual or from generated queries)
 * const testCases = queries.results.map(result =>
 *   result.queries.map(query => ({
 *     id: \`tc_\${Math.random()}\`,
 *     query: query.query,
 *     expected_function: result.function_name,
 *     function_category: catalog.functions.find(f => f.name === result.function_name)?.category || 'unknown',
 *     query_type: query.type,
 *     difficulty: query.difficulty,
 *     generated_by: result.model,
 *     generation_time: result.generation_time,
 *     metadata: {
 *       function_action: catalog.functions.find(f => f.name === result.function_name)?.action || 'unknown',
 *       function_entity: catalog.functions.find(f => f.name === result.function_name)?.entity || 'unknown',
 *       function_complexity: catalog.functions.find(f => f.name === result.function_name)?.complexity || 0,
 *     }
 *   }))
 * ).flat();
 *
 * // 4. Evaluate tool selection
 * const strategy = new StackOneMetaToolsStrategy();
 * const report = await runEvaluation(strategy, testCases);
 *
 * console.log(\`Accuracy: \${(report.metrics.accuracy * 100).toFixed(1)}%\`);
 * ```
 */

// Function extraction
export {
  extractStackOneFunctions,
  runExtraction,
  type ExtractedFunction,
  type FunctionsCatalog,
} from './extract-functions';

// Query generation
export {
  generateQueriesForFunction,
  generateQueriesForFunctions,
  generateQueryDataset,
  type GeneratedQuery,
  type QueryGenerationResult,
  type QueryGenerationOutput,
} from './generate-queries';

// Evaluation system
export {
  evaluateStrategy,
  calculateMetrics,
  analyzeFailures,
  runEvaluation,
  StackOneMetaToolsStrategy,
  type ToolSelectionResult,
  type BenchmarkTestCase,
  type SelectionResult,
  type EvaluationMetrics,
  type EvaluationReport,
  type ToolSelectionStrategy,
} from './evaluate';

// Utility functions
export {
  createBenchmarkDataset,
  splitTestCases,
  type BenchmarkDataset,
} from './utils';

/**
 * Quick start function for external repositories
 *
 * This function provides a simple way to run a complete benchmark
 * workflow in external repositories.
 */
export async function quickBenchmark(options: {
  /** AI model to use for query generation */
  model?: string;
  /** Number of functions to benchmark (for testing) */
  limit?: number;
  /** Category filter (e.g., 'hris', 'crm') */
  category?: string;
  /** Delay between AI requests in ms */
  delay?: number;
  /** Print detailed results */
  verbose?: boolean;
}) {
  const { model = 'gpt-4o-mini', limit = 10, category, delay = 1000, verbose = true } = options;

  console.log('🚀 Running StackOne Tool Selection Benchmark...');

  try {
    // 1. Extract functions
    if (verbose) console.log('\n📊 Step 1: Extracting StackOne functions...');
    const { extractStackOneFunctions } = await import('./extract-functions');
    const catalog = extractStackOneFunctions();

    let functions = catalog.functions;
    if (category) {
      functions = functions.filter((f) => f.category === category);
    }
    if (limit) {
      functions = functions.slice(0, limit);
    }

    if (verbose) {
      console.log(`  Found ${catalog.total_functions} total functions`);
      console.log(`  Selected ${functions.length} functions for benchmarking`);
    }

    // 2. Generate queries
    if (verbose) console.log('\n🤖 Step 2: Generating test queries...');
    const { generateQueryDataset } = await import('./generate-queries');
    const queryData = await generateQueryDataset(functions, { model, delay, limit, category });

    // 3. Create test cases
    if (verbose) console.log('\n📋 Step 3: Creating test cases...');
    const testCases = queryData.results.flatMap((result) =>
      result.queries.map((query) => ({
        id: `tc_${result.function_name}_${Math.random().toString(36).substr(2, 9)}`,
        query: query.query,
        expected_function: result.function_name,
        function_category:
          catalog.functions.find((f) => f.name === result.function_name)?.category || 'unknown',
        query_type: query.type,
        difficulty: query.difficulty,
        generated_by: result.model,
        generation_time: result.generation_time,
        metadata: {
          function_action:
            catalog.functions.find((f) => f.name === result.function_name)?.action || 'unknown',
          function_entity:
            catalog.functions.find((f) => f.name === result.function_name)?.entity || 'unknown',
          function_complexity:
            catalog.functions.find((f) => f.name === result.function_name)?.complexity || 0,
        },
      }))
    );

    if (verbose) console.log(`  Created ${testCases.length} test cases`);

    // 4. Evaluate
    if (verbose) console.log('\n🧪 Step 4: Evaluating tool selection...');
    const { runEvaluation, StackOneMetaToolsStrategy } = await import('./evaluate');
    const strategy = new StackOneMetaToolsStrategy();
    const report = await runEvaluation(strategy, testCases);

    // 5. Print results
    console.log('\n🏆 Benchmark Results:');
    console.log(`  Strategy: ${report.evaluation_info.strategy}`);
    console.log(`  Test Cases: ${report.metrics.total_cases}`);
    console.log(`  Accuracy: ${(report.metrics.accuracy * 100).toFixed(1)}%`);
    console.log(`  Top-3 Accuracy: ${(report.metrics.top_3_accuracy * 100).toFixed(1)}%`);
    console.log(`  Top-5 Accuracy: ${(report.metrics.top_5_accuracy * 100).toFixed(1)}%`);
    console.log(`  MRR: ${report.metrics.mrr.toFixed(3)}`);
    console.log(`  Avg Execution Time: ${report.metrics.avg_execution_time_ms.toFixed(1)}ms`);

    if (verbose && Object.keys(report.metrics.by_category).length > 1) {
      console.log('\n📊 By Category:');
      for (const [cat, stats] of Object.entries(report.metrics.by_category)) {
        console.log(
          `  ${cat}: ${(stats.accuracy * 100).toFixed(1)}% (${stats.correct}/${stats.total})`
        );
      }
    }

    if (verbose && report.failure_analysis.length > 0) {
      console.log(`\n❌ Failures: ${report.failure_analysis.length} cases`);
      const sampleFailures = report.failure_analysis.slice(0, 3);
      sampleFailures.forEach((failure, i) => {
        console.log(`  ${i + 1}. "${failure.query.slice(0, 50)}..."`);
        console.log(`     Expected: ${failure.expected}`);
        console.log(`     Got: ${failure.predicted || 'N/A'}`);
      });
    }

    return report;
  } catch (error) {
    console.error('❌ Benchmark failed:', error);
    throw error;
  }
}
