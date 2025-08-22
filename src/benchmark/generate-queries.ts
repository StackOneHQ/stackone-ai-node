import { openai } from '@ai-sdk/openai';
/**
 * Generate diverse queries for benchmark testing
 *
 * This script can be imported and used in other repositories to generate
 * test queries using various AI providers.
 */
import { generateText } from 'ai';
import { ollama } from 'ollama-ai-provider';
import type { ExtractedFunction } from './extract-functions';

// Types for query generation
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

export interface QueryGenerationOutput {
  generation_info: {
    model: string;
    generated_at: string;
    total_functions: number;
    successful_generations: number;
    failed_generations: number;
  };
  results: QueryGenerationResult[];
}

/**
 * Get the appropriate model provider based on model name
 */
function getModelProvider(modelName: string) {
  if (modelName.startsWith('gpt-') || modelName.startsWith('o1-')) {
    return openai(modelName);
  }
  if (
    modelName.startsWith('llama') ||
    modelName.includes('ollama') ||
    modelName.startsWith('gemma')
  ) {
    return ollama(modelName);
  }
  // Default to OpenAI
  return openai(modelName);
}

/**
 * Generate fallback queries if AI generation fails
 */
function generateFallbackQueries(func: ExtractedFunction): GeneratedQuery[] {
  const queries: GeneratedQuery[] = [];

  // Basic templates based on function metadata
  const _entityVariations = [func.entity, `${func.entity}s`, func.entity.replace(/_/g, ' ')];
  const _actionVariations = [
    func.action,
    func.action === 'create' ? 'add' : func.action,
    func.action === 'list' ? 'show' : func.action,
  ];

  const templates = [
    // Direct/formal (easy)
    { template: `${func.action} ${func.entity}`, type: 'formal', difficulty: 'easy' as const },
    {
      template: `${func.action} a new ${func.entity}`,
      type: 'formal',
      difficulty: 'easy' as const,
    },
    {
      template: `${func.method} ${func.category} ${func.entity}`,
      type: 'formal',
      difficulty: 'easy' as const,
    },

    // Natural/casual (easy)
    {
      template: `I want to ${func.action} ${func.entity}`,
      type: 'casual',
      difficulty: 'easy' as const,
    },
    {
      template: `How do I ${func.action} ${func.entity}?`,
      type: 'casual',
      difficulty: 'easy' as const,
    },
    {
      template: `Need to ${func.action} ${func.entity}`,
      type: 'casual',
      difficulty: 'easy' as const,
    },

    // Business context (medium)
    {
      template: `${func.category} system: ${func.action} ${func.entity}`,
      type: 'business',
      difficulty: 'medium' as const,
    },
    {
      template: `In ${func.category}, ${func.action} a new ${func.entity}`,
      type: 'business',
      difficulty: 'medium' as const,
    },
    {
      template: `Manage ${func.entity} in ${func.category}`,
      type: 'business',
      difficulty: 'medium' as const,
    },

    // Ambiguous (medium)
    { template: `${func.entity} management`, type: 'ambiguous', difficulty: 'medium' as const },
    { template: `work with ${func.entity}`, type: 'ambiguous', difficulty: 'medium' as const },
    {
      template: `${func.category} ${func.entity}`,
      type: 'ambiguous',
      difficulty: 'medium' as const,
    },

    // Complex/edge cases (hard)
    {
      template: `bulk ${func.action} ${func.entity}s`,
      type: 'complex',
      difficulty: 'hard' as const,
    },
    {
      template: `${func.action} ${func.entity} with validation`,
      type: 'complex',
      difficulty: 'hard' as const,
    },
    {
      template: `${func.category} API: ${func.action} ${func.entity}`,
      type: 'complex',
      difficulty: 'hard' as const,
    },
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
}

/**
 * Generate queries for a single function using AI
 */
export async function generateQueriesForFunction(
  func: ExtractedFunction,
  model = 'gpt-4o-mini'
): Promise<GeneratedQuery[]> {
  const paramInfo =
    func.parameters.length > 0
      ? func.parameters
          .map((p) => `${p.name} (${p.type}${p.required ? ', required' : ', optional'})`)
          .join(', ')
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
    const result = await generateText({
      model: getModelProvider(model),
      prompt,
      temperature: 0.8, // Add some creativity
    });

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
}

/**
 * Generate queries for multiple functions
 */
export async function generateQueriesForFunctions(
  functions: ExtractedFunction[],
  model = 'gpt-4o-mini',
  delay = 1000 // Delay between requests to avoid rate limiting
): Promise<QueryGenerationResult[]> {
  const results: QueryGenerationResult[] = [];

  console.log(`🤖 Generating queries for ${functions.length} functions using ${model}...`);

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

      if ((i + 1) % 10 === 0 || i === functions.length - 1) {
        const progress = (((i + 1) / functions.length) * 100).toFixed(1);
        console.log(`  Progress: ${i + 1}/${functions.length} (${progress}%)`);
      }

      // Add delay to avoid rate limiting
      if (i < functions.length - 1 && delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    } catch (error) {
      console.error(`✗ Failed to generate queries for ${func.name}:`, error);
    }
  }

  return results;
}

/**
 * Generate complete query dataset
 */
export async function generateQueryDataset(
  functions: ExtractedFunction[],
  options: {
    model?: string;
    delay?: number;
    limit?: number;
    category?: string;
  } = {}
): Promise<QueryGenerationOutput> {
  const { model = 'gpt-4o-mini', delay = 1000, limit, category } = options;

  // Filter functions if needed
  let filteredFunctions = functions;
  if (category) {
    filteredFunctions = functions.filter((f) => f.category === category);
  }
  if (limit) {
    filteredFunctions = filteredFunctions.slice(0, limit);
  }

  console.log(`\n🎯 Target: ${filteredFunctions.length} functions`);
  if (category) console.log(`📂 Category filter: ${category}`);
  if (limit) console.log(`🔢 Limit: ${limit} functions`);

  // Generate queries
  const results = await generateQueriesForFunctions(filteredFunctions, model, delay);

  // Create output
  const output: QueryGenerationOutput = {
    generation_info: {
      model,
      generated_at: new Date().toISOString(),
      total_functions: filteredFunctions.length,
      successful_generations: results.length,
      failed_generations: filteredFunctions.length - results.length,
    },
    results,
  };

  // Print summary
  console.log('\n📊 Generation Summary:');
  console.log(`Functions processed: ${filteredFunctions.length}`);
  console.log(`Successful generations: ${results.length}`);
  console.log(`Failed generations: ${filteredFunctions.length - results.length}`);
  console.log(`Total queries generated: ${results.reduce((sum, r) => sum + r.queries.length, 0)}`);

  return output;
}
