/**
 * Simple keyword matching strategy for baseline comparison
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ToolSelectionStrategy, ToolSelectionResult, ExtractedFunction } from './base-strategy';

interface FunctionsCatalog {
  version: string;
  generated_at: string;
  total_functions: number;
  categories: Record<string, number>;
  functions: ExtractedFunction[];
}

export class KeywordMatchingStrategy implements ToolSelectionStrategy {
  name = 'keyword-matching';
  description = 'Simple keyword matching with TF-IDF-like scoring';
  
  private functions: ExtractedFunction[] = [];
  private initialized = false;
  
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    const catalogPath = join(process.cwd(), 'data', 'functions-catalog.json');
    const content = await readFile(catalogPath, 'utf-8');
    const catalog = JSON.parse(content) as FunctionsCatalog;
    this.functions = catalog.functions;
    this.initialized = true;
  }
  
  async select(
    query: string,
    availableTools?: string[],
    limit: number = 10
  ): Promise<ToolSelectionResult[]> {
    await this.initialize();
    
    const queryWords = this.tokenize(query.toLowerCase());
    const results: Array<{ func: ExtractedFunction; score: number }> = [];
    
    // Filter functions by available tools if specified
    const candidateFunctions = availableTools
      ? this.functions.filter(f => availableTools.includes(f.name))
      : this.functions;
    
    for (const func of candidateFunctions) {
      const score = this.calculateScore(queryWords, func);
      if (score > 0) {
        results.push({ func, score });
      }
    }
    
    // Sort by score descending and take top results
    results.sort((a, b) => b.score - a.score);
    
    return results.slice(0, limit).map(result => ({
      name: result.func.name,
      description: result.func.description,
      score: result.score,
    }));
  }
  
  private tokenize(text: string): string[] {
    return text
      .replace(/[^a-zA-Z0-9\\s]/g, ' ')
      .split(/\\s+/)
      .filter(word => word.length > 2)
      .filter(word => !this.isStopWord(word));
  }
  
  private isStopWord(word: string): boolean {
    const stopWords = new Set(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'had', 'but', 'with', 'have', 'this', 'will', 'his', 'they', 'from']);
    return stopWords.has(word);
  }
  
  private calculateScore(queryWords: string[], func: ExtractedFunction): number {
    let score = 0;
    
    // Create searchable text from function metadata
    const searchableText = [
      func.name,
      func.description,
      func.summary || '',
      func.category,
      func.action,
      func.entity,
      ...func.tags,
    ].join(' ').toLowerCase();
    
    const functionWords = this.tokenize(searchableText);
    const wordCounts = new Map<string, number>();
    
    // Count words in function text
    for (const word of functionWords) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }
    
    // Calculate score based on query word matches
    for (const queryWord of queryWords) {
      const count = wordCounts.get(queryWord) || 0;
      if (count > 0) {
        // TF-IDF-like scoring
        const tf = count / functionWords.length;
        const bonus = this.getWordBonus(queryWord, func);
        score += tf * (1 + bonus);
      }
    }
    
    // Exact phrase matching bonus
    const exactPhraseBonus = this.calculateExactPhraseBonus(queryWords.join(' '), searchableText);
    score += exactPhraseBonus;
    
    return score;
  }
  
  private getWordBonus(word: string, func: ExtractedFunction): number {
    let bonus = 0;
    
    // Higher weight for matches in name and action
    if (func.name.toLowerCase().includes(word)) bonus += 2;
    if (func.action.toLowerCase().includes(word)) bonus += 1.5;
    if (func.entity.toLowerCase().includes(word)) bonus += 1.5;
    if (func.category.toLowerCase().includes(word)) bonus += 1;
    
    // Category-specific bonuses
    if (word === 'create' && func.action === 'create') bonus += 2;
    if (word === 'update' && func.action === 'update') bonus += 2;
    if (word === 'delete' && func.action === 'delete') bonus += 2;
    if (word === 'list' && func.action === 'list') bonus += 2;
    if (word === 'get' && func.action === 'get') bonus += 2;
    
    return bonus;
  }
  
  private calculateExactPhraseBonus(query: string, text: string): number {
    if (text.includes(query)) {
      return query.split(' ').length * 0.5; // Bonus based on phrase length
    }
    return 0;
  }
  
  async cleanup(): Promise<void> {
    // No cleanup needed
  }
}