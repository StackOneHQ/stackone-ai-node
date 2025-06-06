/**
 * EXPERIMENTAL: Document Handling with PreExecute Functions
 *
 * This example demonstrates the new experimental preExecute functionality
 * for handling documents from various sources (local files, URLs, databases, etc.)
 *
 * This is an experimental feature and the API may change in future versions.
 *
 * Run this example with:
 * bun run examples/experimental-document-handling.ts
 */

import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { StackOneToolSet, type ExperimentalPreExecuteFunction } from '../src';

const accountId = '45072196112816593343';

/**
 * EXPERIMENTAL: Create a document handler that fetches files from local storage
 */
const createLocalFileHandler = (allowedPaths: string[]): ExperimentalPreExecuteFunction => {
  return async (params) => {
    const { document_id, ...otherParams } = params;

    if (typeof document_id !== 'string') {
      return params; // Pass through if not a string
    }

    // Security check: only allow certain paths
    const isAllowed = allowedPaths.some((allowedPath) => document_id.startsWith(allowedPath));

    if (!isAllowed) {
      throw new Error(`Document path not allowed: ${document_id}`);
    }

    if (!fs.existsSync(document_id)) {
      throw new Error(`Document not found: ${document_id}`);
    }

    // Read file and convert to base64
    const fileContent = fs.readFileSync(document_id);
    const base64Content = fileContent.toString('base64');
    const fileName = path.basename(document_id);
    const extension = path.extname(document_id).slice(1);

    // Return modified parameters with document content
    return {
      ...otherParams,
      content: base64Content,
      name: fileName,
      file_format: { value: extension },
    };
  };
};

/**
 * EXPERIMENTAL: Create a document handler for external sources (S3, databases, etc.)
 */
const createExternalDocumentHandler = (): ExperimentalPreExecuteFunction => {
  return async (params) => {
    const { document_reference, ...otherParams } = params;

    if (typeof document_reference !== 'string') {
      return params; // Pass through if not a document reference
    }

    // Simulate fetching from external source (S3, database, etc.)
    console.log(`Fetching document from external source: ${document_reference}`);

    // In a real implementation, this would fetch from S3, database, etc.
    const mockDocumentContent = 'This is a mock document fetched from external source';
    const base64Content = Buffer.from(mockDocumentContent).toString('base64');

    return {
      ...otherParams,
      content: base64Content,
      name: `external-doc-${document_reference}.txt`,
      file_format: { value: 'txt' },
    };
  };
};

/**
 * EXPERIMENTAL: Create a multi-source document handler with fallback logic
 */
const createMultiSourceHandler = (localPaths: string[]): ExperimentalPreExecuteFunction => {
  const localHandler = createLocalFileHandler(localPaths);
  const externalHandler = createExternalDocumentHandler();

  return async (params) => {
    // Try local file handler first
    if (params.document_id) {
      try {
        return await localHandler(params);
      } catch (error) {
        console.warn(`Local file handler failed: ${error}`);
      }
    }

    // Fallback to external handler
    if (params.document_reference) {
      return await externalHandler(params);
    }

    // No document parameters, pass through
    return params;
  };
};

const experimentalDocumentHandling = async (): Promise<void> => {
  // Create a sample file for testing
  const sampleFilePath = path.join(__dirname, 'sample-document.txt');
  fs.writeFileSync(sampleFilePath, 'This is an experimental document handling test file.');

  try {
    // Initialize the StackOne toolset
    const toolset = new StackOneToolSet();

    // Get tools for documents
    const tools = toolset.getStackOneTools('hris_*', accountId);

    // Get the upload file tool
    const uploadTool = tools.getTool('hris_upload_employee_document');

    // Check if upload tool exists
    assert(uploadTool !== undefined, 'Upload document tool not found');

    console.log('🧪 Testing EXPERIMENTAL local file document handling...');

    // EXPERIMENTAL: Create a secure local file handler
    const localFileHandler = createLocalFileHandler([__dirname]);

    // Use the experimental preExecute function for local file handling
    const localFileResult = await uploadTool.execute(
      {
        document_id: sampleFilePath, // Use document_id instead of file_path
        id: 'c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA',
        category: { value: 'shared' },
      },
      {
        dryRun: true,
        experimentalPreExecute: localFileHandler,
      }
    );

    console.log('✅ Local file handling successful');
    assert(
      (localFileResult.mappedParams as Record<string, { value: string }>).file_format.value ===
        'txt',
      'File format was not mapped correctly'
    );

    console.log('🧪 Testing EXPERIMENTAL external document handling...');

    // EXPERIMENTAL: Test external document handler
    const externalHandler = createExternalDocumentHandler();

    const externalResult = await uploadTool.execute(
      {
        document_reference: 'external-doc-123',
        id: 'c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA',
        category: { value: 'shared' },
      },
      {
        dryRun: true,
        experimentalPreExecute: externalHandler,
      }
    );

    console.log('✅ External document handling successful');
    assert(
      (externalResult.mappedParams as Record<string, string>).name.includes('external-doc-123'),
      'External document name was not mapped correctly'
    );

    console.log('🧪 Testing EXPERIMENTAL multi-source handler...');

    // EXPERIMENTAL: Test multi-source handler with fallback
    const multiSourceHandler = createMultiSourceHandler([__dirname]);

    const multiSourceResult = await uploadTool.execute(
      {
        document_id: sampleFilePath,
        id: 'c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA',
        category: { value: 'shared' },
      },
      {
        dryRun: true,
        experimentalPreExecute: multiSourceHandler,
      }
    );

    console.log('✅ Multi-source handling successful');
    assert(
      (multiSourceResult.mappedParams as Record<string, string>).name === 'sample-document.txt',
      'Multi-source document name was not mapped correctly'
    );

    console.log('🎉 All EXPERIMENTAL document handling tests passed!');
    console.log('');
    console.log('⚠️  IMPORTANT: This is experimental functionality.');
    console.log('   The API may change in future versions.');
    console.log('   Use at your own risk in production environments.');
  } finally {
    // Clean up the sample file
    if (fs.existsSync(sampleFilePath)) {
      fs.unlinkSync(sampleFilePath);
    }
  }
};

experimentalDocumentHandling();
