#!/usr/bin/env bun
/**
 * Script to extract all endpoints from OpenAPI specifications
 * 
 * This script reads all generated OpenAPI specs and extracts function information
 * to create a comprehensive catalog for benchmarking tool selection.
 */
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { OpenAPIV3 } from 'openapi-types';
import { SPECS } from '../src/constants';

const OUTPUT_DIR = join(process.cwd(), 'data');
const GENERATED_SPECS_DIR = join(process.cwd(), 'src', 'openapi', 'generated');

// Types for extracted function information
interface ExtractedFunction {
  name: string;           // operationId (e.g., "hris_create_employee")
  category: string;       // API category (e.g., "hris")
  action: string;         // Action type (e.g., "create")
  entity: string;         // Entity type (e.g., "employee")
  description: string;    // Function description
  summary?: string;       // Short summary
  method: string;         // HTTP method
  path: string;          // API path
  parameters: {
    name: string;
    type: string;
    required: boolean;
    description?: string;
    location: 'query' | 'path' | 'header' | 'body';
  }[];
  complexity: number;     // Based on param count and types
  tags: string[];        // Additional tags for search
}

interface FunctionsCatalog {
  version: string;
  generated_at: string;
  total_functions: number;
  categories: Record<string, number>;
  functions: ExtractedFunction[];
}

/**
 * Load a generated OpenAPI spec
 */
const loadSpec = async (specName: string): Promise<OpenAPIV3.Document | null> => {
  try {
    const specModule = await import(`../src/openapi/generated/${specName}.ts`);
    const specKey = `${specName}Spec`;
    return specModule[specKey] as OpenAPIV3.Document;
  } catch (error) {
    console.error(`Failed to load spec ${specName}:`, error);
    return null;
  }
};

/**
 * Parse action and entity from operation ID
 */
const parseOperationId = (operationId: string): { category: string; action: string; entity: string } => {
  const parts = operationId.split('_');
  const category = parts[0] || 'unknown';
  
  // Common actions
  const actionTypes = ['create', 'update', 'delete', 'get', 'list', 'search', 'send', 'execute', 'batch'];
  const actions = parts.filter(p => actionTypes.includes(p));
  const action = actions[0] || 'unknown';
  
  // Extract entity (usually the last meaningful part)
  const nonActionParts = parts.filter(p => !actionTypes.includes(p) && p !== category);
  const entity = nonActionParts[nonActionParts.length - 1] || 'unknown';
  
  return { category, action, entity };
};

/**
 * Calculate complexity score based on parameters
 */
const calculateComplexity = (parameters: any[]): number => {
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
 * Extract parameters from OpenAPI operation
 */
const extractParameters = (operation: OpenAPIV3.OperationObject): ExtractedFunction['parameters'] => {
  const params: ExtractedFunction['parameters'] = [];
  
  // Extract from parameters array (query, path, header params)
  if (operation.parameters) {
    for (const param of operation.parameters) {
      if ('$ref' in param) continue; // Skip references for now
      
      const paramObj = param as OpenAPIV3.ParameterObject;
      const schema = paramObj.schema as OpenAPIV3.SchemaObject;
      
      params.push({
        name: paramObj.name,
        type: schema?.type?.toString() || 'string',
        required: paramObj.required || false,
        description: paramObj.description,
        location: paramObj.in as any,
      });
    }
  }
  
  // Extract from request body (body params)
  if (operation.requestBody && !('$ref' in operation.requestBody)) {
    const requestBody = operation.requestBody as OpenAPIV3.RequestBodyObject;
    const jsonContent = requestBody.content?.['application/json'];
    
    if (jsonContent?.schema && !('$ref' in jsonContent.schema)) {
      const schema = jsonContent.schema as OpenAPIV3.SchemaObject;
      
      if (schema.properties) {
        for (const [propName, propSchema] of Object.entries(schema.properties)) {
          if ('$ref' in propSchema) continue;
          
          const prop = propSchema as OpenAPIV3.SchemaObject;
          params.push({
            name: propName,
            type: prop.type?.toString() || 'string',
            required: schema.required?.includes(propName) || false,
            description: prop.description,
            location: 'body',
          });
        }
      }
    }
  }
  
  return params;
};

/**
 * Extract all functions from a single OpenAPI spec
 */
const extractFunctionsFromSpec = (spec: OpenAPIV3.Document): ExtractedFunction[] => {
  const functions: ExtractedFunction[] = [];
  
  if (!spec.paths) return functions;
  
  for (const [path, pathItem] of Object.entries(spec.paths)) {
    if (!pathItem) continue;
    
    // Check each HTTP method
    const methods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'] as const;
    for (const method of methods) {
      const operation = pathItem[method] as OpenAPIV3.OperationObject;
      if (!operation || !operation.operationId) continue;
      
      const { category, action, entity } = parseOperationId(operation.operationId);
      const parameters = extractParameters(operation);
      const complexity = calculateComplexity(parameters);
      
      // Generate tags for better search
      const tags = [
        ...operation.operationId.split('_'),
        category,
        action, 
        entity,
        method.toUpperCase(),
        ...(operation.tags || []),
      ];
      
      functions.push({
        name: operation.operationId,
        category,
        action,
        entity,
        description: operation.description || operation.summary || '',
        summary: operation.summary,
        method: method.toUpperCase(),
        path,
        parameters,
        complexity,
        tags: [...new Set(tags)], // Remove duplicates
      });
    }
  }
  
  return functions;
};

/**
 * Main function
 */
const main = async (): Promise<void> => {
  console.log('📊 Extracting endpoints from OpenAPI specifications...');
  
  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true });
  }
  
  const allFunctions: ExtractedFunction[] = [];
  const categoryStats: Record<string, number> = {};
  
  // Process each spec
  for (const specName of SPECS) {
    console.log(`Processing ${specName} API spec...`);
    
    const spec = await loadSpec(specName);
    if (!spec) {
      console.warn(`⚠️  Skipped ${specName} spec (failed to load)`);
      continue;
    }
    
    const functions = extractFunctionsFromSpec(spec);
    allFunctions.push(...functions);
    
    // Update category stats
    for (const func of functions) {
      categoryStats[func.category] = (categoryStats[func.category] || 0) + 1;
    }
    
    console.log(`✓ Extracted ${functions.length} functions from ${specName}`);
  }
  
  // Create final catalog
  const catalog: FunctionsCatalog = {
    version: '1.0.0',
    generated_at: new Date().toISOString(),
    total_functions: allFunctions.length,
    categories: categoryStats,
    functions: allFunctions,
  };
  
  // Save catalog
  const outputPath = join(OUTPUT_DIR, 'functions-catalog.json');
  await writeFile(outputPath, JSON.stringify(catalog, null, 2));
  
  // Print summary
  console.log('\\n📈 Extraction Summary:');
  console.log(`Total functions extracted: ${catalog.total_functions}`);
  console.log('Functions per category:');
  for (const [category, count] of Object.entries(categoryStats)) {
    console.log(`  ${category}: ${count}`);
  }
  console.log(`\\n✅ Catalog saved to: ${outputPath}`);
  
  // Generate additional statistics
  const actionStats = allFunctions.reduce((acc, func) => {
    acc[func.action] = (acc[func.action] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const complexityStats = {
    simple: allFunctions.filter(f => f.complexity <= 3).length,
    medium: allFunctions.filter(f => f.complexity > 3 && f.complexity <= 8).length,
    complex: allFunctions.filter(f => f.complexity > 8).length,
  };
  
  console.log('\\nActions distribution:');
  for (const [action, count] of Object.entries(actionStats)) {
    console.log(`  ${action}: ${count}`);
  }
  
  console.log('\\nComplexity distribution:');
  console.log(`  Simple (≤3): ${complexityStats.simple}`);
  console.log(`  Medium (4-8): ${complexityStats.medium}`);
  console.log(`  Complex (>8): ${complexityStats.complex}`);
};

// Run the main function
main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});