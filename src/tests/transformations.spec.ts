/**
 * Tests for parameter transformation functions
 */

import { afterAll, beforeAll, describe, expect, it, mock } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { StackOneError } from '../tools';
import { transformParameter } from '../transformations';
import type { ParameterTransformer } from '../types';

describe('Parameter Transformations', () => {
  // Create a test file for derivation tests
  const testFileContent = 'Test file content';
  const testFilePath = path.join(import.meta.dir, 'test-file.txt');

  // Create the test file before tests
  beforeAll(() => {
    fs.writeFileSync(testFilePath, testFileContent);
  });

  // Remove the test file after tests
  afterAll(() => {
    fs.unlinkSync(testFilePath);
  });

  // Create a test derivation config
  const testParameterTransformer: ParameterTransformer = {
    transforms: {
      content: (filePath: unknown): string => {
        if (typeof filePath !== 'string') {
          throw new Error('file_path must be a string');
        }
        return Buffer.from(fs.readFileSync(filePath)).toString('base64');
      },
      name: (filePath: unknown): string => {
        if (typeof filePath !== 'string') {
          throw new Error('file_path must be a string');
        }
        return path.basename(filePath);
      },
      file_format: (filePath: unknown): { value: string } => {
        if (typeof filePath !== 'string') {
          throw new Error('file_path must be a string');
        }
        const extension = path.extname(filePath).slice(1);
        return { value: extension };
      },
    },
  };

  describe('transformParameter', () => {
    it('should derive multiple parameters from a source parameter', () => {
      // Test content derivation
      const contentResult = transformParameter(
        testFilePath,
        'content',
        'file_path',
        testParameterTransformer
      );
      expect(contentResult).toHaveProperty('content');

      // Test name derivation
      const nameResult = transformParameter(
        testFilePath,
        'name',
        'file_path',
        testParameterTransformer
      );
      expect(nameResult).toHaveProperty('name');
      expect(nameResult.name).toBe('test-file.txt');

      // Test file_format derivation
      const formatResult = transformParameter(
        testFilePath,
        'file_format',
        'file_path',
        testParameterTransformer
      );
      expect(formatResult).toHaveProperty('file_format');
      expect(formatResult.file_format).toEqual({ value: 'txt' });

      // Verify content is base64 encoded
      const decoded = Buffer.from(contentResult.content as string, 'base64').toString('utf-8');
      expect(decoded).toBe(testFileContent);
    });

    it('should handle unknown parameters gracefully', () => {
      const result = transformParameter(
        testFilePath,
        'unknown_param',
        'file_path',
        testParameterTransformer
      );
      expect(Object.keys(result).length).toBe(0);
    });

    it('should handle errors in derivation functions', () => {
      // Create a test derivation config with a function that throws
      const errorConfig: ParameterTransformer = {
        transforms: {
          content: mock(() => {
            throw new Error('Test error');
          }),
        },
      };

      expect(() => transformParameter(testFilePath, 'content', 'file_path', errorConfig)).toThrow(
        StackOneError
      );
    });
  });
});
