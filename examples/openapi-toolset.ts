/**
 * Basic OpenAPI Example
 *
 * This example demonstrates how to:
 * 1. Load OpenAPI specifications from a file
 * 2. Load OpenAPI specifications from a URL
 * 3. Get and execute tools from the specifications
 */

import assert from 'node:assert';
import { OpenAPIToolSet } from '../src/toolsets/openapi';
import { joinPaths } from '../src/utils/file';

/**
 * Type for dry run result
 */
type DryRunResult = {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: string;
};

/**
 * Example of loading OpenAPI specifications from a file
 */
async function fromFileExample(): Promise<void> {
  // Create an OpenAPIToolSet from a local file
  const toolset = new OpenAPIToolSet({
    filePath: joinPaths(process.cwd(), 'src', 'toolsets', 'tests', 'fixtures', 'petstore.json'),
  });

  // Get all tools
  const tools = toolset.getTools('*Pet*');
  assert(tools.length > 0, 'Expected to find tools in the specification');

  // Get a specific tool
  const getPetTool = tools.getTool('getPetById');
  assert(getPetTool !== undefined, 'Expected to find getPetById tool');

  // Execute the tool with dry run to see what would be sent
  const result = (await getPetTool.execute({ petId: 123 }, { dryRun: true })) as DryRunResult;

  assert(result !== undefined, 'Expected to get a result from dry run');
  assert(result.url.includes('/pet/123'), 'Expected URL to contain pet ID');
  assert(result.method === 'GET', 'Expected GET method');
}

/**
 * Example of loading OpenAPI specifications from a URL
 */
async function fromUrlExample(): Promise<void> {
  try {
    // Create an OpenAPIToolSet from a URL
    const toolset = await OpenAPIToolSet.fromUrl({
      url: 'https://api.eu1.stackone.com/oas/hris.json',
    });

    // Get tools matching a pattern
    const hrisTools = toolset.getTools('hris_*');
    assert(hrisTools.length > 0, 'Expected to find a bunch of tools');

    // Get a specific tool
    const getEmployeeTool = hrisTools.getTool('hris_get_employee');
    assert(getEmployeeTool !== undefined, 'Expected to find hris_get_employee tool');
    assert(
      typeof getEmployeeTool.parameters.properties.id === 'object' &&
        getEmployeeTool.parameters.properties.id !== null &&
        getEmployeeTool.parameters.properties.id.type === 'string',
      'Expected to find string parameter for id'
    );

    // Execute the tool with dry run to see what would be sent
    const result = (await getEmployeeTool.execute({ id: 123 }, { dryRun: true })) as DryRunResult;

    assert(result !== undefined, 'Expected to get a result from dry run');
    assert(result.method === 'GET', 'Expected GET method');

    assert(result.url.includes('/employees/123'), 'Expected URL to contain employee ID');
    assert(result.body === undefined, 'Expected body to be undefined');
  } catch (error) {
    throw new Error(
      `Failed to load from URL: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Run the examples
 */
async function main(): Promise<void> {
  try {
    // Run the file example
    await fromFileExample();

    // Run the URL example
    await fromUrlExample();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
