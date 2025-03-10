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
    filePath: joinPaths(__dirname, 'specs', 'petstore.json'),
  });

  // Get all tools
  const tools = toolset.getTools();
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
      url: 'https://petstore3.swagger.io/api/v3/openapi.json',
    });

    // Get tools matching a pattern
    const petTools = toolset.getTools('pet*');
    assert(petTools.length > 0, 'Expected to find pet-related tools');

    // Get a specific tool
    const updatePetTool = petTools.getTool('updatePet');
    assert(updatePetTool !== undefined, 'Expected to find updatePet tool');

    // Execute the tool with dry run to see what would be sent
    const result = (await updatePetTool.execute(
      {
        id: 123,
        name: 'Fluffy',
        status: 'available',
        category: { id: 1, name: 'Dogs' },
        tags: [{ id: 1, name: 'friendly' }],
        photoUrls: ['https://example.com/dog.jpg'],
      },
      { dryRun: true }
    )) as DryRunResult;

    assert(result !== undefined, 'Expected to get a result from dry run');
    assert(result.method === 'PUT', 'Expected PUT method');
    assert(result.url.includes('/pet'), 'Expected URL to contain pet endpoint');
    assert(result.body && typeof result.body === 'string', 'Expected body to be a string');

    const bodyData = JSON.parse(result.body);
    assert(bodyData.name === 'Fluffy', 'Expected body to contain pet data');
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
