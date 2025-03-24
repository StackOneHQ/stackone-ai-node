#!/usr/bin/env bun
/**
 * Script to fetch OpenAPI specifications from the StackOne documentation
 *
 * This script scrapes the StackOne documentation page to find all available
 * OpenAPI specifications, then downloads and saves them to the .oas directory.
 */
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { SPECS } from '../src/constants';

// Configuration
const STACKONE_DOCS_BASE = 'https://api.eu1.stackone.com/oas';

const OUTPUT_DIR = join(process.cwd(), '.oas');

/**
 * Get the list of API specs to download
 */
const getApiSpecs = async (): Promise<Record<string, string>> => {
  console.log('Preparing OpenAPI specs to download...');
  
  const specs: Record<string, string> = {};
  
  for (const name of SPECS) {
    // Include .json extension for the filename
    const filename = `${name}.json`;
    
    // Special handling for stackone - rename to core for backward compatibility
    const specName = name === 'stackone' ? 'core' : name;
    
    specs[specName] = filename;
  }
  
  return specs;
};

/**
 * Fetch an OpenAPI specification
 */
const fetchOasSpec = async (filename: string): Promise<Record<string, unknown>> => {
  const url = `${STACKONE_DOCS_BASE}/${filename}`;
  console.log(`Fetching spec from ${url}...`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch spec ${filename}: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Save an OpenAPI specification to a TypeScript file
 */
const saveSpec = async (name: string, spec: Record<string, unknown>): Promise<void> => {
  // Ensure the output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true });
  }

  const outputPath = join(OUTPUT_DIR, `${name}.ts`);
  const tsContent = `// Generated OpenAPI specification for ${name}
export const ${name}Spec = ${JSON.stringify(spec, null, 2)} as const;
`;
  await writeFile(outputPath, tsContent);
  console.log(`✓ Saved ${name} API specification to ${outputPath}`);
};

/**
 * Main function
 */
const main = async (): Promise<void> => {
  // Get specs and their IDs from the documentation page
  const specs = await getApiSpecs();
  console.log(`Found ${Object.keys(specs).length} API specs to download:`);

  for (const [name, filename] of Object.entries(specs)) {
    console.log(`  - ${name} (${filename})`);
  }

  // Download each spec
  for (const [name, filename] of Object.entries(specs)) {
    try {
      const spec = await fetchOasSpec(filename);
      await saveSpec(name, spec);
    } catch (error) {
      console.error(`✗ Failed to download ${name} spec:`, error);
    }
  }

  // Create an index.ts file that exports all specs
  const specNames = Object.keys(specs);
  if (specNames.length > 0) {
    const indexContent = specNames
      .map(name => `export { ${name}Spec } from './${name}';`)
      .join('\n') + '\n';
    
    await writeFile(join(OUTPUT_DIR, 'index.ts'), indexContent);
    console.log(`✓ Created index.ts file with exports for all ${specNames.length} specs`);
  } else {
    console.warn('No specs found. Index file not created.');
  }

  console.log('Done fetching OpenAPI specifications');
};

// Run the main function
main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
