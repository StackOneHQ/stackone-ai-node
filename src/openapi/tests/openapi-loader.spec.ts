import { describe, expect, it } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { OAS_DIR } from '../../constants';
import { loadSpecs } from '../loader';

describe('Loader', () => {
  it('should load specs from OAS directory', () => {
    // Load specs from the actual .oas directory
    const tools = loadSpecs();

    // Verify that tools were loaded
    // We know there are multiple JSON files in the .oas directory
    expect(Object.keys(tools).length).toBeGreaterThan(0);

    // Check for specific verticals that we know exist
    const availableFiles = fs
      .readdirSync(OAS_DIR)
      .filter((file) => file.endsWith('.json'))
      .map((file) => path.basename(file, '.json'));

    expect(availableFiles).toHaveLength(8);

    // Verify that each vertical from the directory is loaded
    for (const vertical of availableFiles) {
      expect(tools).toHaveProperty(vertical);
      expect(Object.keys(tools[vertical]).length).toBeGreaterThan(0);
    }
  });

  it('should return empty object if OAS directory does not exist', () => {
    // Use a non-existent directory
    const nonExistentDir = path.join(OAS_DIR, 'non-existent');

    const tools = loadSpecs(nonExistentDir);
    expect(Object.keys(tools).length).toBe(0);
  });
});
