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
                    file_path: {
                      type: 'string',
                      description: 'Path to the file to upload',
                    },
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
                  required: ['file_path'],
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
 * Create a user transformer
 * This transformer extracts user_name, user_email, and user_role from user_id
 */
const createUserTransformer = (): ParameterTransformer => {
  // Mock user database
  const userDb: Record<string, { name: string; email: string; role: string }> = {
    user123: { name: 'John Doe', email: 'john.doe@example.com', role: 'admin' },
    user456: { name: 'Jane Smith', email: 'jane.smith@example.com', role: 'user' },
  };

  return {
    transforms: {
      // Extract user name
      user_name: (userId: unknown): string => {
        if (typeof userId !== 'string') {
          throw new Error('user_id must be a string');
        }

        if (!(userId in userDb)) {
          throw new Error(`User not found: ${userId}`);
        }

        return userDb[userId].name;
      },

      // Extract user email
      user_email: (userId: unknown): string => {
        if (typeof userId !== 'string') {
          throw new Error('user_id must be a string');
        }

        if (!(userId in userDb)) {
          throw new Error(`User not found: ${userId}`);
        }

        return userDb[userId].email;
      },

      // Extract user role
      user_role: (userId: unknown): string => {
        if (typeof userId !== 'string') {
          throw new Error('user_id must be a string');
        }

        if (!(userId in userDb)) {
          throw new Error(`User not found: ${userId}`);
        }

        return userDb[userId].role;
      },
    },
  };
};

/**
 * Example of using parameter transformations with OpenAPI
 */
async function main(): Promise<void> {
  console.log('Starting Parameter Transformation Example...');

  // Step 1: Create a mock OpenAPI spec file
  const specFilePath = createMockOpenAPISpec();
  console.log(`Created mock OpenAPI spec at: ${specFilePath}`);

  // Step 2: Create parameter transformers
  const fileTransformer = createFileTransformer();
  const userTransformer = createUserTransformer();

  // Step 3: Create a map of parameter transformers
  const transformers = new Map<string, ParameterTransformer>();
  transformers.set('file_path', fileTransformer);
  transformers.set('user_id', userTransformer);

  console.log('Created parameter transformers');

  // Step 4: Create an OpenAPIToolSet with the parameter transformers
  const toolset = new OpenAPIToolSet({
    filePath: specFilePath,
    transformers,
  });

  console.log('Created OpenAPIToolSet with parameter transformers');

  // Step 5: Get the tools
  const tools = toolset.getTools();
  const fileUploadTool = tools.getTool('upload_file');
  const updateUserTool = tools.getTool('update_user');

  assert(fileUploadTool, 'Expected to find upload_file tool');
  assert(updateUserTool, 'Expected to find update_user tool');

  console.log('Found tools: upload_file, update_user');

  // Step 6: Create a temp file for testing
  const tempFilePath = path.join(__dirname, 'temp.txt');
  fs.writeFileSync(tempFilePath, 'Hello, world!');
  console.log(`Created temp file at: ${tempFilePath}`);

  try {
    // Step 7: Test file upload transformations
    console.log('\n=== File Upload Transformations ===\n');

    // Execute with just file_path - other parameters will be transformed
    const fileUploadResult = await fileUploadTool.execute(
      { file_path: tempFilePath },
      { dryRun: true }
    );

    console.log('File upload result:');
    console.log(JSON.stringify(fileUploadResult, null, 2));

    // Step 8: Test user data transformations
    console.log('\n=== User Data Transformations ===\n');

    // Execute with just user_id - other parameters will be transformed
    const updateUserResult = await updateUserTool.execute({ user_id: 'user123' }, { dryRun: true });

    console.log('Update user result:');
    console.log(JSON.stringify(updateUserResult, null, 2));

    // Step 9: Print transformed parameters
    console.log('\nTransformed file parameters:');
    const fileParams = fileUploadResult.mappedParams as Record<string, unknown>;
    console.log(`- file_name: ${fileParams.file_name}`);
    console.log(`- file_format: ${fileParams.file_format}`);
    console.log(
      `- file_content: ${(fileParams.file_content as string).substring(0, 20)}... (base64)`
    );

    console.log('\nTransformed user parameters:');
    const userParams = updateUserResult.mappedParams as Record<string, unknown>;
    console.log(`- user_name: ${userParams.user_name}`);
    console.log(`- user_email: ${userParams.user_email}`);
    console.log(`- user_role: ${userParams.user_role}`);

    console.log('\nParameter Transformation Example completed successfully!');
  } finally {
    // Step 10: Clean up
    try {
      fs.unlinkSync(tempFilePath);
      fs.unlinkSync(specFilePath);
      console.log('Cleaned up temporary files');
    } catch (error) {
      console.error('Error cleaning up temporary files:', error);
    }
  }
}

// Run the example
main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
