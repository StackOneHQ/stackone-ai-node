/**
 * EXPERIMENTAL: Document Handling with Schema Override + PreExecute
 *
 * This example demonstrates the new experimental schema override + preExecute functionality
 * for handling documents from various sources (local files, URLs, databases, etc.)
 *
 * The new API provides two-stage transformation:
 * 1. Schema Override: Changes the tool's input schema at creation time
 * 2. PreExecute: Transforms from override schema back to original API format at execution time
 *
 * This is an experimental feature and the API may change in future versions.
 *
 * Run this example with:
 * bun run examples/experimental-document-handling.ts
 */

import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { JSONSchema7Definition } from 'json-schema';
import {
  type Experimental_PreExecuteFunction,
  type Experimental_SchemaOverride,
  StackOneToolSet,
} from '../src';
import { ACCOUNT_IDS } from './constants';

const accountId = ACCOUNT_IDS.HRIS;

interface FileFormatParam {
  value: string;
}

interface DocumentParams {
  content: string;
  name: string;
  file_format: FileFormatParam;
  [key: string]: unknown;
}

/**
 * EXPERIMENTAL: Schema override for document upload - changes from complex schema to simple doc_id
 */
const createDocumentSchemaOverride = (): Experimental_SchemaOverride => {
  return (originalSchema) => {
    // Extract only the category from original schema, replace file-related params with doc_id
    const newProperties: Record<string, JSONSchema7Definition> = {};

    // Keep non-file parameters from original schema
    for (const [key, value] of Object.entries(originalSchema.properties)) {
      if (!['content', 'name', 'file_format'].includes(key)) {
        newProperties[key] = value;
      }
    }

    // Add simplified document ID parameter
    newProperties.doc_id = {
      type: 'string',
      description: 'Document identifier or file path',
    };

    return {
      type: 'object',
      properties: newProperties,
      required: [
        'doc_id',
        ...(originalSchema.required?.filter(
          (r) => !['content', 'name', 'file_format'].includes(r)
        ) || []),
      ],
    };
  };
};

/**
 * EXPERIMENTAL: PreExecute function that transforms doc_id back to original file parameters
 */
const createDocumentPreExecute = (allowedPaths: string[]): Experimental_PreExecuteFunction => {
  return async (params) => {
    const { doc_id, ...otherParams } = params;

    if (typeof doc_id !== 'string') {
      throw new Error('doc_id must be a string');
    }

    // Security check: only allow certain paths
    const isAllowed = allowedPaths.some((allowedPath) => doc_id.startsWith(allowedPath));

    if (!isAllowed) {
      throw new Error(`Document path not allowed: ${doc_id}`);
    }

    if (!fs.existsSync(doc_id)) {
      throw new Error(`Document not found: ${doc_id}`);
    }

    // Read file and convert to base64
    const fileContent = fs.readFileSync(doc_id);
    const base64Content = fileContent.toString('base64');
    const fileName = path.basename(doc_id);
    const extension = path.extname(doc_id).slice(1);

    // Transform back to original API format
    return {
      ...otherParams,
      content: base64Content,
      name: fileName,
      file_format: { value: extension },
    };
  };
};

/**
 * EXPERIMENTAL: Schema override for external document references
 */
const createExternalDocumentSchemaOverride = (): Experimental_SchemaOverride => {
  return (originalSchema) => {
    const newProperties: Record<string, JSONSchema7Definition> = {};

    // Keep non-file parameters from original schema
    for (const [key, value] of Object.entries(originalSchema.properties)) {
      if (!['content', 'name', 'file_format'].includes(key)) {
        newProperties[key] = value;
      }
    }

    // Add external document reference parameter
    newProperties.document_reference = {
      type: 'string',
      description: 'External document reference (S3 key, database ID, etc.)',
    };

    return {
      type: 'object',
      properties: newProperties,
      required: [
        'document_reference',
        ...(originalSchema.required?.filter(
          (r) => !['content', 'name', 'file_format'].includes(r)
        ) || []),
      ],
    };
  };
};

/**
 * EXPERIMENTAL: PreExecute function for external document fetching
 */
const createExternalDocumentPreExecute = (): Experimental_PreExecuteFunction => {
  return async (params) => {
    const { document_reference, ...otherParams } = params;

    if (typeof document_reference !== 'string') {
      throw new Error('document_reference must be a string');
    }

    // Simulate fetching from external source (S3, database, etc.)
    console.log(`Fetching document from external source: ${document_reference}`);

    // In a real implementation, this would fetch from S3, database, etc.
    const mockDocumentContent = 'This is a mock document fetched from external source';
    const base64Content = Buffer.from(mockDocumentContent).toString('base64');

    // Transform back to original API format
    return {
      ...otherParams,
      content: base64Content,
      name: `external-doc-${document_reference}.txt`,
      file_format: { value: 'txt' },
    };
  };
};

/**
 * EXPERIMENTAL: Schema override for multi-source documents (supports both local and external)
 */
const createMultiSourceSchemaOverride = (): Experimental_SchemaOverride => {
  return (originalSchema) => {
    const newProperties: Record<string, JSONSchema7Definition> = {};

    // Keep non-file parameters from original schema
    for (const [key, value] of Object.entries(originalSchema.properties)) {
      if (!['content', 'name', 'file_format'].includes(key)) {
        newProperties[key] = value;
      }
    }

    // Add both document parameters (user can provide either)
    newProperties.doc_id = {
      type: 'string',
      description: 'Local document path (takes precedence if both provided)',
    };

    newProperties.document_reference = {
      type: 'string',
      description: 'External document reference (used if doc_id not provided)',
    };

    return {
      type: 'object',
      properties: newProperties,
      required: [
        ...(originalSchema.required?.filter(
          (r) => !['content', 'name', 'file_format'].includes(r)
        ) || []),
      ],
    };
  };
};

/**
 * EXPERIMENTAL: PreExecute function for multi-source document handling with fallback
 */
const createMultiSourcePreExecute = (localPaths: string[]): Experimental_PreExecuteFunction => {
  const localPreExecute = createDocumentPreExecute(localPaths);
  const externalPreExecute = createExternalDocumentPreExecute();

  return async (params) => {
    // Try local file first if doc_id is provided
    if (params.doc_id) {
      try {
        return await localPreExecute(params);
      } catch (error) {
        console.warn(`Local file handler failed: ${error}`);
      }
    }

    // Fallback to external handler if document_reference is provided
    if (params.document_reference) {
      return await externalPreExecute(params);
    }

    // No document parameters provided
    throw new Error('Either doc_id or document_reference must be provided');
  };
};

const experimentalDocumentHandling = async (): Promise<void> => {
  // Create a sample file for testing
  const sampleFilePath = path.join(__dirname, 'sample-document.txt');
  fs.writeFileSync(sampleFilePath, 'This is an experimental document handling test file.');

  try {
    // Initialize the StackOne toolset
    const toolset = new StackOneToolSet();

    // Get base tools for documents
    const tools = toolset.getStackOneTools('hris_*', accountId);

    console.log('🧪 Testing EXPERIMENTAL schema override + preExecute for local files...');

    // EXPERIMENTAL: Create a tool with schema override and preExecute for local files
    const localDocumentTool = tools.getTool('hris_upload_employee_document', {
      experimental_schemaOverride: createDocumentSchemaOverride(),
      experimental_preExecute: createDocumentPreExecute([__dirname]),
    });

    assert(localDocumentTool !== undefined, 'Local document tool not found');

    // Use the new simplified schema (doc_id instead of content/name/file_format)
    const localFileResult = await localDocumentTool.execute(
      {
        doc_id: sampleFilePath, // Simplified schema - just document ID
        id: 'c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA',
        category: { value: 'shared' },
      },
      {
        dryRun: true,
      }
    );

    console.log('✅ Local file schema override + preExecute successful');
    const localParams = localFileResult.mappedParams as Record<string, unknown>;
    const localDocumentParams = localParams as DocumentParams & Record<string, unknown>;
    assert(
      localDocumentParams.file_format?.value === 'txt',
      'File format was not transformed correctly'
    );
    assert(
      localDocumentParams.name === 'sample-document.txt',
      'File name was not transformed correctly'
    );
    assert(
      typeof localDocumentParams.content === 'string',
      'File content was not transformed correctly'
    );

    console.log('🧪 Testing EXPERIMENTAL schema override + preExecute for external documents...');

    // EXPERIMENTAL: Create a tool for external document references
    const externalDocumentTool = tools.getTool('hris_upload_employee_document', {
      experimental_schemaOverride: createExternalDocumentSchemaOverride(),
      experimental_preExecute: createExternalDocumentPreExecute(),
    });

    assert(externalDocumentTool !== undefined, 'External document tool not found');

    const externalResult = await externalDocumentTool.execute(
      {
        document_reference: 'external-doc-123', // Simplified schema - just reference
        id: 'c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA',
        category: { value: 'shared' },
      },
      {
        dryRun: true,
      }
    );

    console.log('✅ External document schema override + preExecute successful');
    const externalParams = externalResult.mappedParams as Record<string, unknown>;
    const externalDocumentParams = externalParams as DocumentParams & Record<string, unknown>;
    assert(
      externalDocumentParams.name.includes('external-doc-123'),
      'External document name was not transformed correctly'
    );

    console.log('🧪 Testing EXPERIMENTAL multi-source schema override + preExecute...');

    // EXPERIMENTAL: Create a tool that supports both local and external documents
    const multiSourceTool = tools.getTool('hris_upload_employee_document', {
      experimental_schemaOverride: createMultiSourceSchemaOverride(),
      experimental_preExecute: createMultiSourcePreExecute([__dirname]),
    });

    assert(multiSourceTool !== undefined, 'Multi-source tool not found');

    // Test with local file
    const multiSourceLocalResult = await multiSourceTool.execute(
      {
        doc_id: sampleFilePath, // Local file takes precedence
        id: 'c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA',
        category: { value: 'shared' },
      },
      {
        dryRun: true,
      }
    );

    console.log('✅ Multi-source (local) schema override + preExecute successful');
    const multiLocalParams = multiSourceLocalResult.mappedParams as Record<string, unknown>;
    const multiLocalDocumentParams = multiLocalParams as DocumentParams & Record<string, unknown>;
    assert(
      multiLocalDocumentParams.name === 'sample-document.txt',
      'Multi-source local document name was not transformed correctly'
    );

    // Test with external reference
    const multiSourceExternalResult = await multiSourceTool.execute(
      {
        document_reference: 'external-doc-456', // Fallback to external
        id: 'c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA',
        category: { value: 'shared' },
      },
      {
        dryRun: true,
      }
    );

    console.log('✅ Multi-source (external) schema override + preExecute successful');
    const multiExternalParams = multiSourceExternalResult.mappedParams as Record<string, unknown>;
    const multiExternalDocumentParams = multiExternalParams as DocumentParams &
      Record<string, unknown>;
    assert(
      multiExternalDocumentParams.name.includes('external-doc-456'),
      'Multi-source external document name was not transformed correctly'
    );

    console.log('🎉 All EXPERIMENTAL schema override + preExecute tests passed!');
    console.log('');
    console.log('📋 API Summary:');
    console.log('   1. experimental_schemaOverride: Changes tool input schema at creation time');
    console.log(
      '   2. experimental_preExecute: Transforms from override schema to original API format'
    );
    console.log('   3. Two-stage transformation: Schema definition → Parameter transformation');
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
