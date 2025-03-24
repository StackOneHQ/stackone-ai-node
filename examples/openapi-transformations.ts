/**
 * OpenAPI with Parameter Transformations Example
 *
 * This example demonstrates how to:
 * 1. Create custom parameter transformers
 * 2. Use them with OpenAPI tools to derive additional parameters
 * 3. Execute tools with minimal input, letting the transformers handle the rest
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { OpenAPIToolSet } from '../src/toolsets/openapi';
import type { ParameterTransformer } from '../src/types';

/**
 * Create a mock OpenAPI specification for testing
 */
const createMockOpenAPISpec = (): string => {
  // Create a simple OpenAPI spec with two operations
  const spec = {
    openapi: '3.0.0',
    info: {
      title: 'Parameter Transformation API',
      version: '1.0.0',
    },
    paths: {
      '/upload': {
        post: {
          operationId: 'upload_file',
          description: 'Upload a file',
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    file_content: {
                      type: 'string',
                      description: 'Base64-encoded file content',
                    },
                    file_name: {
                      type: 'string',
                      description: 'Name of the file',
                    },
                    file_format: {
                      type: 'string',
                      description: 'Format of the file',
                    },
                  },
                  required: ['file_content', 'file_name', 'file_format'],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'File uploaded successfully',
            },
          },
        },
      },
      '/users/{user_id}': {
        put: {
          operationId: 'update_user',
          description: 'Update user details',
          parameters: [
            {
              name: 'user_id',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
              },
            },
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user_name: {
                      type: 'string',
                      description: 'User name',
                    },
                    user_email: {
                      type: 'string',
                      description: 'User email',
                    },
                    user_role: {
                      type: 'string',
                      description: 'User role',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'User updated successfully',
            },
          },
        },
      },
    },
  };

  // Write the spec to a temporary file
  const tempFile = path.join(
    process.env.TMPDIR || '/tmp',
    `parameter-transformation-spec-${Date.now()}.json`
  );
  fs.writeFileSync(tempFile, JSON.stringify(spec, null, 2));

  return tempFile;
};

/**
 * Create a file transformer
 * This transformer extracts file_content, file_name, and file_format from file_path
 */
const createFileTransformer = (): ParameterTransformer => {
  return {
    transforms: {
      // Extract file content as base64
      file_content: (filePath: unknown): string => {
        if (typeof filePath !== 'string') {
          throw new Error('file_path must be a string');
        }

        if (!fs.existsSync(filePath)) {
          throw new Error(`File not found: ${filePath}`);
        }

        return fs.readFileSync(filePath).toString('base64');
      },

      // Extract file name
      file_name: (filePath: unknown): string => {
        if (typeof filePath !== 'string') {
          throw new Error('file_path must be a string');
        }

        return path.basename(filePath);
      },

      // Extract file format (extension)
      file_format: (filePath: unknown): string => {
        if (typeof filePath !== 'string') {
          throw new Error('file_path must be a string');
        }

        const extension = path.extname(filePath).slice(1);
        return extension || '';
      },
    },
  };
};

/**
 * Example of using parameter transformations with OpenAPI
 */
async function main(): Promise<void> {
  const specFilePath = createMockOpenAPISpec();
  const fileTransformer = createFileTransformer();

  // Create a transformers map for the toolset
  const transformers = new Map<string, ParameterTransformer>();
  transformers.set('file_path', fileTransformer);

  // Create the toolset with transformers
  const toolset = new OpenAPIToolSet({
    filePath: specFilePath,
    transformers,
  });

  // Get the tools
  const tools = toolset.getTools();
  const fileUploadTool = tools.getTool('upload_file');

  assert(fileUploadTool, 'Expected to find upload_file tool');

  const tempFilePath = path.join(__dirname, 'temp.txt');
  fs.writeFileSync(tempFilePath, 'Hello, world!');

  try {
    // Execute with just file_path - other parameters will be transformed
    const fileUploadResult = await fileUploadTool.execute(
      { file_path: tempFilePath },
      { dryRun: true }
    );

    const fileParams = fileUploadResult.mappedParams as Record<string, unknown>;

    // Assertions to validate the transformations worked
    assert(fileParams.file_name === 'temp.txt', 'Expected file_name to be transformed correctly');
    assert(fileParams.file_format === 'txt', 'Expected file_format to be transformed correctly');
    assert(
      typeof fileParams.file_content === 'string' && fileParams.file_content.length > 0,
      'Expected file_content to be transformed correctly'
    );
  } finally {
    try {
      fs.unlinkSync(tempFilePath);
      fs.unlinkSync(specFilePath);
      console.log('Cleaned up temporary files');
    } catch (error) {
      console.error('Error cleaning up temporary files:', error);
    }
  }
}

main();
