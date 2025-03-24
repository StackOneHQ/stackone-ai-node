import { describe, expect, it } from 'bun:test';
import { loadStackOneSpecs } from '../loader';

describe('StackOne OpenAPI Loader', () => {
  it('should load specs from OAS directory', () => {
    // Load specs from the actual .oas directory
    const tools = loadStackOneSpecs();

    // Verify that tools were loaded
    // We know there are multiple JSON files in the .oas directory
    expect(Object.keys(tools).length).toBeGreaterThan(0);
  });
});
