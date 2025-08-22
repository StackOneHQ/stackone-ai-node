/**
 * Type definitions for benchmark system
 */

// Function metadata types
export interface ExtractedFunction {
  name: string;
  category: string;
  action: string;
  entity: string;
  description: string;
  summary?: string;
  method: string;
  path: string;
  parameters: Array<{
    name: string;
    type: string;
    required: boolean;
    description?: string;
    location: string;
  }>;
  complexity: number;
  tags: string[];
}

export interface FunctionsCatalog {
  version: string;
  generated_at: string;
  total_functions: number;
  categories: Record<string, number>;
  functions: ExtractedFunction[];
}

// Query generation types
export interface GeneratedQuery {
  query: string;
  type: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface QueryGenerationResult {
  function_name: string;
  queries: GeneratedQuery[];
  generation_time: string;
  model: string;
}

export interface QueryGenerationFile {
  generation_info: {
    model: string;
    generated_at: string;
    total_functions: number;
    successful_generations: number;
    failed_generations: number;
    category_filter?: string;
    limit_filter?: number;
  };
  results: QueryGenerationResult[];
}

// Benchmark dataset types
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
    available_functions?: string[];
  };
}

export interface BenchmarkDataset {
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

// Evaluation types
export interface ToolSelectionResult {
  name: string;
  description: string;
  score: number;
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
  by_query_type: Record<
    string,
    {
      total: number;
      correct: number;
      accuracy: number;
    }
  >;
  by_model: Record<
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

// Strategy comparison types
export interface StrategyMetrics {
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

export interface ComparisonReport {
  comparison_info: {
    dataset_version: string;
    evaluated_at: string;
    split_used: string;
    total_test_cases: number;
    strategies_compared: string[];
  };
  strategy_metrics: StrategyMetrics[];
  detailed_results: Record<string, SelectionResult[]>;
  head_to_head_comparison: Array<{
    test_case_id: string;
    query: string;
    expected_function: string;
    category: string;
    difficulty: string;
    results_by_strategy: Record<
      string,
      {
        predicted: string | null;
        score?: number;
        rank?: number;
        correct: boolean;
        time_ms: number;
      }
    >;
  }>;
  winner_analysis: {
    overall_winner: string;
    category_winners: Record<string, string>;
    difficulty_winners: Record<string, string>;
    speed_winner: string;
  };
}
