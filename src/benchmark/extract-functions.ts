/**
 * Extract functions for benchmarking using OpenAPILoader
 *
 * This script can be imported and used in other repositories to extract
 * all StackOne API functions for benchmark dataset creation.
 */
import { loadStackOneSpecs } from '../openapi/loader';
import type { ToolDefinition } from '../types';

// Types for extracted function information
export interface ExtractedFunction {
  name: string; // operationId (e.g., "hris_create_employee")
  category: string; // API category (e.g., "hris")
  action: string; // Action type (e.g., "create")
  entity: string; // Entity type (e.g., "employee")
  description: string; // Function description
  summary?: string; // Short summary
  method: string; // HTTP method
  path: string; // API path
  parameters: Array<{
    name: string;
    type: string;
    required: boolean;
    description?: string;
    location: 'query' | 'path' | 'header' | 'body';
  }>;
  complexity: number; // Based on param count and types
  tags: string[]; // Additional tags for search
}

export interface FunctionsCatalog {
  version: string;
  generated_at: string;
  total_functions: number;
  categories: Record<string, number>;
  functions: ExtractedFunction[];
}

/**
 * Parse action and entity from operation ID
 */
const parseOperationId = (
  operationId: string
): { category: string; action: string; entity: string } => {
  const parts = operationId.split('_');
  const category = parts[0] || 'unknown';

  // Common actions
  const actionTypes = [
    'create',
    'update',
    'delete',
    'get',
    'list',
    'search',
    'send',
    'execute',
    'batch',
  ];
  const actions = parts.filter((p) => actionTypes.includes(p));
  const action = actions[0] || 'unknown';

  // Extract entity (usually the last meaningful part)
  const nonActionParts = parts.filter((p) => !actionTypes.includes(p) && p !== category);
  const entity = nonActionParts[nonActionParts.length - 1] || 'unknown';

  return { category, action, entity };
};

/**
 * Calculate complexity score based on parameters
 */
const calculateComplexity = (
  parameters: Array<{ name: string; type: string; required: boolean; location: string }>
): number => {
  let score = 0;
  for (const param of parameters) {
    score += 1; // Base score for each parameter
    if (param.required) score += 1; // Extra for required params
    if (param.type === 'object') score += 2; // Extra for complex types
    if (param.type === 'array') score += 1; // Extra for arrays
  }
  return score;
};

/**
 * Convert ToolDefinition to ExtractedFunction
 */
const convertToolDefinition = (
  toolName: string,
  toolDef: ToolDefinition,
  category: string
): ExtractedFunction => {
  const { category: parsedCategory, action, entity } = parseOperationId(toolName);

  // Extract parameters from tool definition
  const parameters = toolDef.execute.params.map((param) => ({
    name: param.name,
    type: param.type?.toString() || 'string',
    required: toolDef.parameters.required?.includes(param.name) || false,
    description:
      typeof toolDef.parameters.properties?.[param.name] === 'object'
        ? (
            toolDef.parameters.properties[param.name] as { description?: string }
          )?.description?.toString()
        : undefined,
    location: param.location as 'query' | 'path' | 'header' | 'body',
  }));

  const complexity = calculateComplexity(parameters);

  // Generate tags for better search
  const tags = [
    ...toolName.split('_'),
    parsedCategory || category,
    action,
    entity,
    toolDef.execute.method,
  ];

  return {
    name: toolName,
    category: parsedCategory || category,
    action,
    entity,
    description: toolDef.description,
    summary: toolDef.description, // ToolDefinition doesn't have separate summary
    method: toolDef.execute.method,
    path: toolDef.execute.url.replace(/^https?:\/\/[^/]+/, ''), // Remove base URL
    parameters,
    complexity,
    tags: [...new Set(tags)], // Remove duplicates
  };
};

/**
 * Extract all StackOne functions using OpenAPILoader
 *
 * @param baseUrl Optional base URL (defaults to StackOne API)
 * @param removedParams Optional array of parameter names to remove
 * @returns Catalog of all extracted functions
 */
export function extractStackOneFunctions(
  baseUrl?: string,
  removedParams: string[] = []
): FunctionsCatalog {
  // Load all StackOne specs using loadStackOneSpecs function
  const allSpecs = loadStackOneSpecs(baseUrl, removedParams);

  const allFunctions: ExtractedFunction[] = [];
  const categoryStats: Record<string, number> = {};

  // Process each category (hris, ats, crm, etc.)
  for (const [category, tools] of Object.entries(allSpecs)) {
    // Convert each ToolDefinition to ExtractedFunction
    for (const [toolName, toolDef] of Object.entries(tools)) {
      const extractedFunction = convertToolDefinition(toolName, toolDef, category);
      allFunctions.push(extractedFunction);

      // Update category stats
      categoryStats[extractedFunction.category] =
        (categoryStats[extractedFunction.category] || 0) + 1;
    }
  }

  return {
    version: '1.0.0',
    generated_at: new Date().toISOString(),
    total_functions: allFunctions.length,
    categories: categoryStats,
    functions: allFunctions,
  };
}

/**
 * CLI script runner (if run directly)
 */
export async function runExtraction() {
  console.log('📊 Extracting StackOne functions using OpenAPILoader...');

  const catalog = extractStackOneFunctions();

  console.log('\n📈 Extraction Summary:');
  console.log(`Total functions extracted: ${catalog.total_functions}`);
  console.log('Functions per category:');
  for (const [category, count] of Object.entries(catalog.categories)) {
    console.log(`  ${category}: ${count}`);
  }

  // Generate additional statistics
  const actionStats = catalog.functions.reduce(
    (acc, func) => {
      acc[func.action] = (acc[func.action] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const complexityStats = {
    simple: catalog.functions.filter((f) => f.complexity <= 3).length,
    medium: catalog.functions.filter((f) => f.complexity > 3 && f.complexity <= 8).length,
    complex: catalog.functions.filter((f) => f.complexity > 8).length,
  };

  console.log('\nActions distribution:');
  for (const [action, count] of Object.entries(actionStats)) {
    console.log(`  ${action}: ${count}`);
  }

  console.log('\nComplexity distribution:');
  console.log(`  Simple (≤3): ${complexityStats.simple}`);
  console.log(`  Medium (4-8): ${complexityStats.medium}`);
  console.log(`  Complex (>8): ${complexityStats.complex}`);

  return catalog;
}

// Run if this file is executed directly
if (import.meta.main) {
  runExtraction().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
}
