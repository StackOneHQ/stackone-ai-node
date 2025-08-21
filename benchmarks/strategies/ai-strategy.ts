/**
 * AI-based selection strategy using LLMs for direct function selection
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { ollama } from 'ollama-ai-provider';
import type { ToolSelectionStrategy, ToolSelectionResult, ExtractedFunction } from './base-strategy';

interface FunctionsCatalog {
  version: string;
  generated_at: string;
  total_functions: number;
  categories: Record<string, number>;
  functions: ExtractedFunction[];
}

export class AIDirectSelectionStrategy implements ToolSelectionStrategy {
  name: string;
  description: string;
  
  private functions: ExtractedFunction[] = [];
  private initialized = false;
  private modelName: string;
  
  constructor(modelName: string = 'gpt-4o-mini') {
    this.modelName = modelName;
    this.name = `ai-direct-${modelName.replace(':', '-')}`;
    this.description = `Direct AI-based selection using ${modelName}`;
  }
  
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    const catalogPath = join(process.cwd(), 'data', 'functions-catalog.json');
    const content = await readFile(catalogPath, 'utf-8');
    const catalog = JSON.parse(content) as FunctionsCatalog;
    this.functions = catalog.functions;
    this.initialized = true;
  }
  
  private getModelProvider() {
    if (this.modelName.startsWith('gpt-') || this.modelName.startsWith('o1-')) {
      return openai(this.modelName);
    } else if (this.modelName.startsWith('llama') || this.modelName.includes('ollama') || this.modelName.startsWith('gemma')) {
      return ollama(this.modelName);
    } else {
      return openai(this.modelName);
    }
  }
  
  async select(
    query: string,
    availableTools?: string[],
    limit: number = 10
  ): Promise<ToolSelectionResult[]> {
    await this.initialize();
    
    // Filter functions by available tools if specified
    const candidateFunctions = availableTools
      ? this.functions.filter(f => availableTools.includes(f.name))
      : this.functions;
    
    if (candidateFunctions.length === 0) {
      return [];
    }
    
    // Create function descriptions for the prompt
    const functionDescriptions = candidateFunctions
      .map(f => `${f.name}: ${f.description} [Category: ${f.category}, Action: ${f.action}, Entity: ${f.entity}]`)
      .join('\\n');
    
    const prompt = `Given this user query: "${query}"
    
Select the most relevant functions from the following list and rank them by relevance (1 = most relevant).
Only return the top ${limit} most relevant functions.

Available functions:
${functionDescriptions}

Respond with a JSON array of objects, each with:
- "name": the exact function name
- "score": relevance score from 0.0 to 1.0 (1.0 = perfect match)
- "reasoning": brief explanation why this function matches

Format: [{"name": "function_name", "score": 0.95, "reasoning": "explanation"}]

Important: Return only valid JSON, no other text.`;

    try {
      const result = await generateText({
        model: this.getModelProvider(),
        prompt,
        temperature: 0.1, // Low temperature for consistent results
      });
      
      // Parse the JSON response
      const cleanResult = result.text.trim();
      const jsonMatch = cleanResult.match(/\\[[\\s\\S]*\\]/);
      
      if (!jsonMatch) {
        console.warn(`AI strategy: No JSON found in response for query: ${query.slice(0, 50)}...`);
        return [];
      }
      
      const selections = JSON.parse(jsonMatch[0]) as Array<{
        name: string;
        score: number;
        reasoning?: string;
      }>;
      
      // Convert to ToolSelectionResult format
      const results: ToolSelectionResult[] = [];
      for (const selection of selections) {
        const func = candidateFunctions.find(f => f.name === selection.name);
        if (func) {
          results.push({
            name: selection.name,
            description: func.description,
            score: selection.score,
          });
        }
      }
      
      return results;
      
    } catch (error) {
      console.error(`AI strategy error for query "${query.slice(0, 50)}...":`, error);
      
      // Fallback: simple keyword matching
      return this.fallbackSelection(query, candidateFunctions, limit);
    }
  }
  
  private fallbackSelection(
    query: string,
    functions: ExtractedFunction[],
    limit: number
  ): ToolSelectionResult[] {
    const queryLower = query.toLowerCase();
    const results: Array<{ func: ExtractedFunction; score: number }> = [];
    
    for (const func of functions) {
      let score = 0;
      const searchText = `${func.name} ${func.description} ${func.category} ${func.action} ${func.entity}`.toLowerCase();
      
      // Simple keyword scoring
      const queryWords = queryLower.split(/\\s+/);
      for (const word of queryWords) {
        if (searchText.includes(word)) {
          score += 0.1;
        }
      }
      
      if (score > 0) {
        results.push({ func, score });
      }
    }
    
    results.sort((a, b) => b.score - a.score);
    
    return results.slice(0, limit).map(r => ({
      name: r.func.name,
      description: r.func.description,
      score: r.score,
    }));
  }
  
  async cleanup(): Promise<void> {
    // No cleanup needed
  }
}