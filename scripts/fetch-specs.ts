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

// Configuration
const STACKONE_DOCS_BASE = 'https://docs.stackone.com';
const STACKONE_DOCS_URL = `${STACKONE_DOCS_BASE}/openapi`;
const OUTPUT_DIR = join(process.cwd(), '.oas');

/**
 * Scrape OpenAPI spec URLs and their IDs from the documentation page
 */
const getApiSpecs = async (): Promise<Record<string, string>> => {
  console.log('Scraping OpenAPI specs from documentation...');

  const response = await fetch(STACKONE_DOCS_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch documentation page: ${response.statusText}`);
  }

  const html = await response.text();

  // Simple HTML parsing to find links (similar to BeautifulSoup in Python)
  const specs: Record<string, string> = {};
  const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
  let match: RegExpExecArray | null = null;

  // Rewrite the while loop to avoid assignment in expression
  match = linkRegex.exec(html);
  while (match !== null) {
    const href = match[1];
    const text = match[2];

    if (href.startsWith('/openapi/')) {
      // Extract the ID from the link
      const specId = href.split('/').pop() || '';

      // Parse the name from the link text (e.g., "CRM - v1.0" -> "crm")
      let name = text.split('-')[0].trim().toLowerCase();
      if (name === 'stackone') {
        name = 'core';
      }

      specs[name] = specId;
    }

    // Get the next match
    match = linkRegex.exec(html);
  }

  return specs;
};

/**
 * Fetch an OpenAPI specification using its ID
 */
const fetchOasSpec = async (specId: string): Promise<Record<string, unknown>> => {
  const url = `${STACKONE_DOCS_BASE}/openapi/${specId}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch spec ${specId}: ${response.statusText}`);
  }

  // Try to parse as JSON first
  try {
    return await response.json();
  } catch (_error) {
    // If JSON parsing fails, try to parse as YAML
    // Note: In a real implementation, you'd need to add a YAML parser dependency
    // For now, we'll just return the text and handle the error
    console.warn(`Spec ${specId} is not valid JSON. YAML parsing not implemented.`);
    return { error: 'YAML parsing not implemented' };
  }
};

/**
 * Save an OpenAPI specification to a file
 */
const saveSpec = async (name: string, spec: Record<string, unknown>): Promise<void> => {
  // Ensure the output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true });
  }

  const outputPath = join(OUTPUT_DIR, `${name}.json`);
  await writeFile(outputPath, JSON.stringify(spec, null, 2));
  console.log(`✓ Saved ${name} API specification to ${outputPath}`);
};

/**
 * Main function
 */
const main = async (): Promise<void> => {
  // Get specs and their IDs from the documentation page
  const specs = await getApiSpecs();
  console.log(`Found ${Object.keys(specs).length} API specs to download:`);

  for (const [name, specId] of Object.entries(specs)) {
    console.log(`  - ${name} (${specId})`);
  }

  // Download each spec
  for (const [name, specId] of Object.entries(specs)) {
    try {
      const spec = await fetchOasSpec(specId);
      await saveSpec(name, spec);
    } catch (error) {
      console.error(`✗ Failed to download ${name} spec:`, error);
    }
  }

  console.log('Done fetching OpenAPI specifications');
};

// Run the main function
main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
