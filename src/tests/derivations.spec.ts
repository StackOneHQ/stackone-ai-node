import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { derivationFunctions, deriveParameters } from '../derivations';
import { StackOneError } from '../tools';

describe('Parameter Derivations', () => {
  const testFilePath = path.join(import.meta.dir, 'test-file.txt');
  const testFileContent = 'This is a test file for derivation functions';

  beforeEach(() => {
    // Create a test file
    fs.writeFileSync(testFilePath, testFileContent);
  });

  afterEach(() => {
    // Clean up test file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }

    // Restore mocks
    mock.restore();
  });

  describe('derivationFunctions', () => {
    it('should derive content from file_path', () => {
      const content = derivationFunctions.content(testFilePath);
      expect(typeof content).toBe('string');

      // Decode base64 content and verify it matches the original
      const decoded = Buffer.from(content as string, 'base64').toString('utf-8');
      expect(decoded).toBe(testFileContent);
    });

    it('should derive name from file_path', () => {
      const name = derivationFunctions.name(testFilePath);
      expect(name).toBe('test-file.txt');
    });

    it('should derive file_format from file_path', () => {
      const format = derivationFunctions.file_format(testFilePath);
      expect(format).toEqual({ value: 'txt' });
    });

    it('should handle missing file extension', () => {
      const noExtPath = path.join(import.meta.dir, 'test-file-no-ext');
      fs.writeFileSync(noExtPath, 'File with no extension');

      try {
        const format = derivationFunctions.file_format(noExtPath);
        expect(format).toBeNull();
      } finally {
        fs.unlinkSync(noExtPath);
      }
    });

    it('should throw error for invalid file path', () => {
      const invalidPath = '/path/to/nonexistent/file.txt';
      expect(() => derivationFunctions.content(invalidPath)).toThrow(StackOneError);
    });

    it('should throw error for non-string file path', () => {
      expect(() => derivationFunctions.content(123)).toThrow(StackOneError);
      expect(() => derivationFunctions.name(null)).toThrow(StackOneError);
      expect(() => derivationFunctions.file_format(undefined)).toThrow(StackOneError);
    });
  });

  describe('deriveParameters', () => {
    it('should derive multiple parameters from a source parameter', () => {
      const result = deriveParameters('file_path', testFilePath, [
        'content',
        'name',
        'file_format',
      ]);

      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('file_format');

      expect(result.name).toBe('test-file.txt');
      expect(result.file_format).toEqual({ value: 'txt' });

      // Verify content is base64 encoded
      const decoded = Buffer.from(result.content as string, 'base64').toString('utf-8');
      expect(decoded).toBe(testFileContent);
    });

    it('should handle unknown parameters gracefully', () => {
      const result = deriveParameters('file_path', testFilePath, ['unknown_param']);
      expect(Object.keys(result).length).toBe(0);
    });

    it('should handle errors in derivation functions', () => {
      // Mock the content derivation function to throw an error
      const originalFn = derivationFunctions.content;
      derivationFunctions.content = mock(() => {
        throw new Error('Test error');
      });

      expect(() => deriveParameters('file_path', testFilePath, ['content', 'name'])).toThrow(
        StackOneError
      );

      // Restore the original function
      derivationFunctions.content = originalFn;
    });
  });
});
