#!/usr/bin/env bun
/**
 * Script to generate diverse user queries using Vercel AI SDK
 * 
 * This script takes function information and generates various natural language
 * queries that users might use to find and execute those functions.
 */
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { ollama } from 'ollama-ai-provider';
// Note: Add this import when the package is installed
// import { google } from '@ai-sdk/google';

const DATA_DIR = join(process.cwd(), 'data');
const CATALOG_PATH = join(DATA_DIR, 'functions-catalog.json');

// Types for function information
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

/**
 * Load the functions catalog
 */
const loadCatalog = async (): Promise<FunctionsCatalog> => {
  if (!existsSync(CATALOG_PATH)) {
    throw new Error(`Functions catalog not found at ${CATALOG_PATH}. Run 'bun run scripts/extract-endpoints.ts' first.`);
  }
  
  const content = await readFile(CATALOG_PATH, 'utf-8');
  return JSON.parse(content);
};

/**
 * Get the appropriate model provider based on model name
 */
const getModelProvider = (modelName: string) => {
  if (modelName.startsWith('gpt-') || modelName.startsWith('o1-')) {
    return openai(modelName);
  } else if (modelName.startsWith('gemini-')) {
    // return google(modelName); // Uncomment when @ai-sdk/google is installed
    throw new Error('Google Gemini support requires @ai-sdk/google package. Install with: bun add @ai-sdk/google');
  } else if (modelName.startsWith('llama') || modelName.includes('ollama') || modelName.startsWith('gemma')) {
    return ollama(modelName);
  } else {
    // Default to OpenAI
    return openai(modelName);
  }
};

/**
 * Generate queries for a single function using AI SDK
 */
const generateQueriesForFunction = async (
  func: ExtractedFunction,
  model: string = 'gpt-5-mini'
): Promise<GeneratedQuery[]> => {
  const paramInfo = func.parameters.length > 0 
    ? func.parameters.map(p => `${p.name} (${p.type}${p.required ? ', required' : ', optional'})`).join(', ')
    : 'No parameters required';
  
  const prompt = `Given this API function:
- Name: ${func.name}
- Category: ${func.category} 
- Action: ${func.action}
- Entity: ${func.entity}
- Description: ${func.description}
- Method: ${func.method}
- Parameters: ${paramInfo}

Generate exactly 15 diverse user queries that someone might use to find this function. 
Cover different styles and difficulty levels:

1-3: Direct/formal queries (easy difficulty)
4-6: Natural/casual language (easy difficulty) 
7-9: Business context queries (medium difficulty)
10-12: Ambiguous/partial information (medium difficulty)
13-15: Complex/edge cases (hard difficulty)

Format the response as a JSON array with this structure:
[
  {
    "query": "exact query text",
    "type": "formal|casual|business|ambiguous|complex",
    "difficulty": "easy|medium|hard"
  }
]

Important: Respond only with valid JSON, no other text.`;

  try {
    console.log(`Generating queries for ${func.name}...`);
    
    // gpt-5-* 系は temperature の明示指定が未対応なため条件分岐
    const isGpt5 = model.startsWith('gpt-5-');
    const genArgs = isGpt5
      ? { model: getModelProvider(model), prompt }
      : { model: getModelProvider(model), prompt, temperature: 0.8 as const };

    const result = await generateText(genArgs as any);
    
    // Parse the JSON response
    const cleanResult = result.text.trim();
    
    // Look for JSON array in the response
    const jsonMatch = cleanResult.match(/\[[\s\S]*\]/);
    
    if (!jsonMatch) {
      console.warn(`No JSON array found in response for ${func.name}, using fallback`);
      return generateFallbackQueries(func);
    }
    
    const queries = JSON.parse(jsonMatch[0]) as GeneratedQuery[];
    
    // Validate we got 15 queries
    if (queries.length !== 15) {
      console.warn(`Expected 15 queries for ${func.name}, got ${queries.length}`);
    }
    
    return queries;
  } catch (error) {
    console.error(`Failed to generate queries for ${func.name}:`, error);
    
    // Fallback: generate simple template-based queries
    return generateFallbackQueries(func);
  }
};

/**
 * Generate fallback queries if AI generation fails
 */
const generateFallbackQueries = (func: ExtractedFunction): GeneratedQuery[] => {
  const queries: GeneratedQuery[] = [];
  
  // Basic templates based on function metadata
  const entityVariations = [func.entity, func.entity + 's', func.entity.replace(/_/g, ' ')];
  const actionVariations = [func.action, func.action === 'create' ? 'add' : func.action, func.action === 'list' ? 'show' : func.action];
  
  const templates = [
    // Direct/formal (easy)
    { template: `${func.action} ${func.entity}`, type: 'formal', difficulty: 'easy' as const },
    { template: `${func.action} a new ${func.entity}`, type: 'formal', difficulty: 'easy' as const },
    { template: `${func.method} ${func.category} ${func.entity}`, type: 'formal', difficulty: 'easy' as const },
    
    // Natural/casual (easy)
    { template: `I want to ${func.action} ${func.entity}`, type: 'casual', difficulty: 'easy' as const },
    { template: `How do I ${func.action} ${func.entity}?`, type: 'casual', difficulty: 'easy' as const },
    { template: `Need to ${func.action} ${func.entity}`, type: 'casual', difficulty: 'easy' as const },
    
    // Business context (medium)
    { template: `${func.category} system: ${func.action} ${func.entity}`, type: 'business', difficulty: 'medium' as const },
    { template: `In ${func.category}, ${func.action} a new ${func.entity}`, type: 'business', difficulty: 'medium' as const },
    { template: `Manage ${func.entity} in ${func.category}`, type: 'business', difficulty: 'medium' as const },
    
    // Ambiguous (medium)
    { template: `${func.entity} management`, type: 'ambiguous', difficulty: 'medium' as const },
    { template: `work with ${func.entity}`, type: 'ambiguous', difficulty: 'medium' as const },
    { template: `${func.category} ${func.entity}`, type: 'ambiguous', difficulty: 'medium' as const },
    
    // Complex/edge cases (hard)
    { template: `bulk ${func.action} ${func.entity}s`, type: 'complex', difficulty: 'hard' as const },
    { template: `${func.action} ${func.entity} with validation`, type: 'complex', difficulty: 'hard' as const },
    { template: `${func.category} API: ${func.action} ${func.entity}`, type: 'complex', difficulty: 'hard' as const },
  ];
  
  // Use templates up to 15 queries
  for (let i = 0; i < Math.min(15, templates.length); i++) {
    const template = templates[i];
    queries.push({
      query: template.template,
      type: template.type,
      difficulty: template.difficulty,
    });
  }
  
  return queries;
};

/**
 * Generate queries for multiple functions
 */
const generateQueriesForFunctions = async (
  functions: ExtractedFunction[],
  model: string = 'gpt-5-mini',
  delay: number = 1000 // Delay between requests to avoid rate limiting
): Promise<QueryGenerationResult[]> => {
  const results: QueryGenerationResult[] = [];
  
  for (let i = 0; i < functions.length; i++) {
    const func = functions[i];
    
    try {
      const queries = await generateQueriesForFunction(func, model);
      
      results.push({
        function_name: func.name,
        queries,
        generation_time: new Date().toISOString(),
        model,
      });
      
      console.log(`✓ Generated ${queries.length} queries for ${func.name} (${i + 1}/${functions.length})`);
      
      // Add delay to avoid rate limiting
      if (i < functions.length - 1 && delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
    } catch (error) {
      console.error(`✗ Failed to generate queries for ${func.name}:`, error);
    }
  }
  
  return results;
};

/**
 * Main function
 */
const main = async (): Promise<void> => {
  const args = process.argv.slice(2);
  const model = args.find(arg => arg.startsWith('--model='))?.split('=')[1] || 'gpt-5-mini';
  const limit = args.find(arg => arg.startsWith('--limit='))?.split('=')[1];
  const category = args.find(arg => arg.startsWith('--category='))?.split('=')[1];
  const delay = parseInt(args.find(arg => arg.startsWith('--delay='))?.split('=')[1] || '1000');
  
  // Check for required API keys based on model
  const requiresOpenAI = model.startsWith('gpt-') || model.startsWith('o1-');
  const requiresGoogle = model.startsWith('gemini-');
  
  if (requiresOpenAI && !process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY environment variable is required for OpenAI models');
    console.log('Set it by running: export OPENAI_API_KEY="your-api-key"');
    process.exit(1);
  }
  
  if (requiresGoogle && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.error('❌ GOOGLE_GENERATIVE_AI_API_KEY environment variable is required for Gemini models');
    console.log('Set it by running: export GOOGLE_GENERATIVE_AI_API_KEY="your-api-key"');
    process.exit(1);
  }
  
  console.log('🤖 Generating user queries with Vercel AI SDK...');
  console.log(`Model: ${model}`);
  console.log(`Delay: ${delay}ms between requests`);
  
  // Load catalog
  const catalog = await loadCatalog();
  console.log(`Loaded ${catalog.total_functions} functions from catalog`);
  
  // Filter functions if needed
  let functions = catalog.functions;
  if (category) {
    functions = functions.filter(f => f.category === category);
    console.log(`Filtered to ${functions.length} functions in category: ${category}`);
  }
  if (limit) {
    functions = functions.slice(0, parseInt(limit));
    console.log(`Limited to first ${functions.length} functions`);
  }
  
  // Generate queries
  const results = await generateQueriesForFunctions(functions, model, delay);
  
  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `queries-${category || 'all'}-${timestamp}.json`;
  const outputPath = join(DATA_DIR, filename);
  
  const output = {
    generation_info: {
      model,
      generated_at: new Date().toISOString(),
      total_functions: functions.length,
      successful_generations: results.length,
      failed_generations: functions.length - results.length,
      category_filter: category,
      limit_filter: limit ? parseInt(limit) : null,
    },
    results,
  };
  
  await writeFile(outputPath, JSON.stringify(output, null, 2));
  
  // Print summary
  console.log('\\n📊 Generation Summary:');
  console.log(`Functions processed: ${functions.length}`);
  console.log(`Successful generations: ${results.length}`);
  console.log(`Failed generations: ${functions.length - results.length}`);
  console.log(`Total queries generated: ${results.reduce((sum, r) => sum + r.queries.length, 0)}`);
  console.log(`\\n✅ Results saved to: ${outputPath}`);
  
  // Show sample queries
  if (results.length > 0) {
    const sampleResult = results[0];
    console.log(`\\n💬 Sample queries for "${sampleResult.function_name}":`);
    sampleResult.queries.slice(0, 5).forEach((q, i) => {
      console.log(`  ${i + 1}. [${q.type}/${q.difficulty}] "${q.query}"`);
    });
  }
};

// Run the main function
if (import.meta.main) {
  main().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
}
