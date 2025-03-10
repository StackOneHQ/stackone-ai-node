/**
 * Example showing how to upload files using the StackOne SDK.
 *
 * This example demonstrates how to upload files using the simplified file_path parameter,
 * which is the only parameter needed for file uploads. The SDK automatically derives
 * the necessary file parameters (content, name, file_format) from the file_path.
 */

import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { StackOneToolSet } from '../src';

const accountId = '45072196112816593343';

const fileUploads = async (): Promise<void> => {
  // Create a sample file for testing
  const sampleFilePath = path.join(__dirname, 'sample-file.txt');
  fs.writeFileSync(sampleFilePath, 'This is a sample file for testing file uploads.');

  try {
    // Initialize the StackOne toolset
    const toolset = new StackOneToolSet();

    // Get tools for documents
    const tools = toolset.getStackOneTools('hris_*', accountId);

    // Get the upload file tool
    const uploadTool = tools.getTool('hris_upload_employee_document');

    // Check if upload tool exists
    assert(uploadTool !== undefined, 'Upload document tool not found');

    /*
     * Upload a file using the file_path parameter
     * The SDK will automatically derive content, name, and file_format from the file_path
     * Read more about transformed parameters in the [Derived Parameters](parameter-derivation.md)
     */
    const result = await uploadTool.execute({
      file_path: sampleFilePath,
      id: 'c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA',
      category: { value: 'shared' },
    });

    // Verify the result
    assert(result !== undefined, 'Expected result to be defined');
    assert(typeof result === 'object', 'Expected result to be an object');
  } finally {
    // Clean up the sample file
    if (fs.existsSync(sampleFilePath)) {
      fs.unlinkSync(sampleFilePath);
    }
  }
};

fileUploads();
