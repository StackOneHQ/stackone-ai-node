#!/usr/bin/env bun
/**
 * Script to build benchmark dataset from generated queries
 * 
 * This script combines all generated query files into a structured benchmark
 * dataset with train/test/validation splits for evaluating tool selection accuracy.
 */
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const DATA_DIR = join(process.cwd(), 'data');
const BENCHMARKS_DIR = join(process.cwd(), 'benchmarks');

// Types for the dataset structure
interface GeneratedQuery {
  query: string;
  type: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface QueryGenerationResult {
  function_name: string;
  queries: GeneratedQuery[];
  generation_time: string;
  model: string;
}

interface QueryFile {
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
    available_functions?: string[]; // For future use in evaluation
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
    train: string[]; // Array of test case IDs
    test: string[];
    validation: string[];
  };
  test_cases: BenchmarkTestCase[];
}

interface ExtractedFunction {
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

interface FunctionsCatalog {
  version: string;
  generated_at: string;
  total_functions: number;
  categories: Record<string, number>;
  functions: ExtractedFunction[];
}

/**
 * Load the functions catalog
 */
const loadCatalog = async (): Promise<FunctionsCatalog> => {
  const catalogPath = join(DATA_DIR, 'functions-catalog.json');
  if (!existsSync(catalogPath)) {
    throw new Error('Functions catalog not found. Run extract-endpoints.ts first.');
  }
  
  const content = await readFile(catalogPath, 'utf-8');
  return JSON.parse(content);
};

/**
 * Find all query generation result files
 */
const findQueryFiles = async (): Promise<string[]> => {
  const files = await readdir(DATA_DIR);
  return files
    .filter(file => file.startsWith('queries-') && file.endsWith('.json'))
    .map(file => join(DATA_DIR, file));
};

/**
 * Load and parse all query files
 */
const loadQueryFiles = async (filePaths: string[]): Promise<QueryFile[]> => {
  const queryFiles: QueryFile[] = [];
  
  for (const filePath of filePaths) {
    try {
      const content = await readFile(filePath, 'utf-8');
      const queryFile = JSON.parse(content) as QueryFile;
      queryFiles.push(queryFile);
      console.log(`✓ Loaded ${queryFile.results.length} function results from ${filePath}`);
    } catch (error) {
      console.warn(`⚠️  Failed to load ${filePath}:`, error);
    }
  }
  
  return queryFiles;
};

/**
 * Create test cases from query files and function catalog
 */
const createTestCases = (
  queryFiles: QueryFile[], 
  catalog: FunctionsCatalog
): BenchmarkTestCase[] => {
  const testCases: BenchmarkTestCase[] = [];
  const functionMap = new Map(catalog.functions.map(f => [f.name, f]));
  let caseCounter = 1;
  
  for (const queryFile of queryFiles) {
    for (const result of queryFile.results) {
      const func = functionMap.get(result.function_name);
      if (!func) {
        console.warn(`Function ${result.function_name} not found in catalog`);
        continue;
      }
      
      for (const query of result.queries) {
        const testCase: BenchmarkTestCase = {
          id: `tc_${caseCounter.toString().padStart(6, '0')}`,
          query: query.query,
          expected_function: result.function_name,
          function_category: func.category,
          query_type: query.type,
          difficulty: query.difficulty,
          generated_by: queryFile.generation_info.model,
          generation_time: result.generation_time,
          metadata: {
            function_action: func.action,
            function_entity: func.entity,
            function_complexity: func.complexity,
          },
        };
        
        testCases.push(testCase);
        caseCounter++;
      }
    }
  }
  
  return testCases;
};

/**
 * Create train/test/validation splits
 * Strategy: Split by function to avoid data leakage
 */
const createSplits = (
  testCases: BenchmarkTestCase[], 
  catalog: FunctionsCatalog,
  trainRatio: number = 0.7,
  testRatio: number = 0.2,
  validationRatio: number = 0.1
): { train: string[], test: string[], validation: string[] } => {
  // Group test cases by function
  const functionGroups = new Map<string, BenchmarkTestCase[]>();
  for (const testCase of testCases) {
    const functionName = testCase.expected_function;
    if (!functionGroups.has(functionName)) {
      functionGroups.set(functionName, []);
    }
    functionGroups.get(functionName)!.push(testCase);
  }
  
  // Get all function names and shuffle them
  const allFunctions = Array.from(functionGroups.keys());
  const shuffledFunctions = allFunctions.sort(() => Math.random() - 0.5);
  
  // Calculate split sizes
  const totalFunctions = shuffledFunctions.length;
  const trainSize = Math.floor(totalFunctions * trainRatio);
  const testSize = Math.floor(totalFunctions * testRatio);
  const validationSize = totalFunctions - trainSize - testSize;
  
  // Split functions
  const trainFunctions = shuffledFunctions.slice(0, trainSize);
  const testFunctions = shuffledFunctions.slice(trainSize, trainSize + testSize);
  const validationFunctions = shuffledFunctions.slice(trainSize + testSize);
  
  console.log(`Function splits: Train(${trainFunctions.length}) Test(${testFunctions.length}) Validation(${validationFunctions.length})`);
  
  // Collect test case IDs for each split
  const splits = {
    train: [] as string[],
    test: [] as string[],
    validation: [] as string[],
  };
  
  for (const functionName of trainFunctions) {
    splits.train.push(...functionGroups.get(functionName)!.map(tc => tc.id));
  }
  
  for (const functionName of testFunctions) {
    splits.test.push(...functionGroups.get(functionName)!.map(tc => tc.id));
  }
  
  for (const functionName of validationFunctions) {
    splits.validation.push(...functionGroups.get(functionName)!.map(tc => tc.id));
  }
  
  return splits;
};

/**
 * Generate statistics for the dataset
 */
const generateStatistics = (
  testCases: BenchmarkTestCase[], 
  queryFiles: QueryFile[]
): BenchmarkDataset['statistics'] => {
  const functionCounts = new Map<string, number>();
  const typeCounts = new Map<string, number>();
  const difficultyCounts = new Map<string, number>();
  const modelsUsed = new Set<string>();
  
  for (const testCase of testCases) {
    // Count functions per category
    const category = testCase.function_category;
    functionCounts.set(category, (functionCounts.get(category) || 0) + 1);
    
    // Count query types
    const type = testCase.query_type;
    typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
    
    // Count difficulties
    const difficulty = testCase.difficulty;
    difficultyCounts.set(difficulty, (difficultyCounts.get(difficulty) || 0) + 1);
    
    // Track models
    modelsUsed.add(testCase.generated_by);
  }
  
  // Count unique functions
  const uniqueFunctions = new Set(testCases.map(tc => tc.expected_function));
  
  return {
    total_test_cases: testCases.length,
    total_functions: uniqueFunctions.size,
    functions_per_category: Object.fromEntries(functionCounts),
    queries_per_type: Object.fromEntries(typeCounts),
    queries_per_difficulty: Object.fromEntries(difficultyCounts),
    models_used: Array.from(modelsUsed),
  };
};

/**
 * Main function
 */
const main = async (): Promise<void> => {
  const args = process.argv.slice(2);
  const outputName = args.find(arg => arg.startsWith('--output='))?.split('=')[1] || 'benchmark-dataset';
  const trainRatio = parseFloat(args.find(arg => arg.startsWith('--train-ratio='))?.split('=')[1] || '0.7');
  const testRatio = parseFloat(args.find(arg => arg.startsWith('--test-ratio='))?.split('=')[1] || '0.2');
  const validationRatio = parseFloat(args.find(arg => arg.startsWith('--validation-ratio='))?.split('=')[1] || '0.1');
  
  console.log('🏗️  Building benchmark dataset from generated queries...');
  console.log(`Split ratios: Train(${trainRatio}) Test(${testRatio}) Validation(${validationRatio})`);
  
  // Ensure benchmarks directory exists
  if (!existsSync(BENCHMARKS_DIR)) {
    await mkdir(BENCHMARKS_DIR, { recursive: true });
  }
  
  // Load function catalog
  console.log('📖 Loading functions catalog...');
  const catalog = await loadCatalog();
  
  // Find and load all query files
  console.log('🔍 Finding query generation files...');
  const queryFilePaths = await findQueryFiles();
  if (queryFilePaths.length === 0) {
    throw new Error('No query files found. Run generate-queries-with-ai-sdk.ts first.');
  }
  
  console.log(`Found ${queryFilePaths.length} query files`);
  const queryFiles = await loadQueryFiles(queryFilePaths);
  
  // Create test cases
  console.log('⚙️  Creating test cases from queries...');
  const testCases = createTestCases(queryFiles, catalog);
  console.log(`Created ${testCases.length} test cases`);
  
  // Create splits
  console.log('📊 Creating train/test/validation splits...');
  const splits = createSplits(testCases, catalog, trainRatio, testRatio, validationRatio);
  
  // Generate statistics
  console.log('📈 Generating dataset statistics...');
  const statistics = generateStatistics(testCases, queryFiles);
  
  // Build final dataset
  const dataset: BenchmarkDataset = {
    version: '1.0.0',
    generated_at: new Date().toISOString(),
    description: 'Benchmark dataset for evaluating tool selection accuracy in StackOne AI Node SDK',
    statistics,
    splits,
    test_cases: testCases,
  };
  
  // Save dataset
  const outputPath = join(BENCHMARKS_DIR, `${outputName}.json`);
  await writeFile(outputPath, JSON.stringify(dataset, null, 2));
  
  // Print summary
  console.log('\\n📊 Dataset Summary:');
  console.log(`Total test cases: ${statistics.total_test_cases}`);
  console.log(`Unique functions: ${statistics.total_functions}`);
  console.log(`Train cases: ${splits.train.length}`);
  console.log(`Test cases: ${splits.test.length}`);
  console.log(`Validation cases: ${splits.validation.length}`);
  console.log('\\nFunctions per category:');
  for (const [category, count] of Object.entries(statistics.functions_per_category)) {
    console.log(`  ${category}: ${count}`);
  }
  console.log('\\nQueries per difficulty:');
  for (const [difficulty, count] of Object.entries(statistics.queries_per_difficulty)) {
    console.log(`  ${difficulty}: ${count}`);
  }
  console.log(`\\nModels used: ${statistics.models_used.join(', ')}`);
  console.log(`\\n✅ Dataset saved to: ${outputPath}`);
  
  // Save splits as separate files for convenience
  await writeFile(
    join(BENCHMARKS_DIR, `${outputName}-train.json`),
    JSON.stringify(testCases.filter(tc => splits.train.includes(tc.id)), null, 2)
  );
  await writeFile(
    join(BENCHMARKS_DIR, `${outputName}-test.json`),
    JSON.stringify(testCases.filter(tc => splits.test.includes(tc.id)), null, 2)
  );
  await writeFile(
    join(BENCHMARKS_DIR, `${outputName}-validation.json`),
    JSON.stringify(testCases.filter(tc => splits.validation.includes(tc.id)), null, 2)
  );
  
  console.log(`\\n📁 Split files saved as separate JSON files in ${BENCHMARKS_DIR}/`);
};

// Run the main function
if (import.meta.main) {
  main().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
}