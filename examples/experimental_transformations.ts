/**
 * EXPERIMENTAL: Parameter Transformations
 *
 * This example demonstrates experimental parameter transformation functionality
 * with experimental_ prefixed APIs for comparison with the current ParameterMapper approach.
 *
 * This is an experimental feature and the API may change in future versions.
 *
 * Run this example with:
 * bun run examples/experimental_transformations.ts
 */

import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { StackOneToolSet, type JsonDict } from '../src';

const accountId = '45072196112816593343';

/**
 * EXPERIMENTAL: Type definition for a transformation function
 */
type Experimental_TransformFunction = (sourceValue: unknown) => unknown;

/**
 * EXPERIMENTAL: Type definition for a map of transformation functions
 */
type Experimental_TransformFunctions = Record<string, Experimental_TransformFunction>;

/**
 * EXPERIMENTAL: Configuration for parameter transformations
 */
type Experimental_ParameterTransformer = {
  transforms: Experimental_TransformFunctions;
};

/**
 * EXPERIMENTAL: Type definition for a map of transformation configurations
 */
type Experimental_ParameterTransformerMap = Map<string, Experimental_ParameterTransformer>;

/**
 * EXPERIMENTAL: Parameter transformation handler
 */
class Experimental_ParameterMapper {
  private transformers: Experimental_ParameterTransformerMap;

  constructor(transformers?: Experimental_ParameterTransformerMap) {
    this.transformers = transformers || new Map<string, Experimental_ParameterTransformer>();
  }

  /**
   * Add a transformer for a parameter
   */
  addTransformer(sourceParam: string, transformer: Experimental_ParameterTransformer): void {
    this.transformers.set(sourceParam, transformer);
  }

  /**
   * Get a transformer for a parameter
   */
  getTransformer(sourceParam: string): Experimental_ParameterTransformer | undefined {
    return this.transformers.get(sourceParam);
  }

  /**
   * Create a preExecute function that applies transformations
   */
  createPreExecuteFunction() {
    return async (params: JsonDict): Promise<JsonDict> => {
      // Create a copy of the parameters to avoid modifying the original
      const mappedParams: JsonDict = { ...params };

      // Process transformed parameters
      for (const [sourceParam, config] of this.transformers.entries()) {
        // Skip if source parameter is not present
        if (!(sourceParam in params)) continue;

        // Get the source parameter value
        const sourceValue = params[sourceParam];

        // Process each transformation function
        for (const targetParam of Object.keys(config.transforms)) {
          try {
            // Transform the parameter value
            const derivedValue = config.transforms[targetParam](sourceValue);
            if (derivedValue !== null) {
              mappedParams[targetParam] = derivedValue;
            }
          } catch (error) {
            throw new Error(
              `Error transforming parameter ${targetParam} from ${sourceParam}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }

        // Remove source parameter after transformation
        delete mappedParams[sourceParam];
      }

      return mappedParams;
    };
  }
}

/**
 * EXPERIMENTAL: File handling transformations
 */
const createExperimental_FileTransformations = (): Experimental_ParameterMapper => {
  const mapper = new Experimental_ParameterMapper();

  // Transform file_path to multiple parameters
  mapper.addTransformer('file_path', {
    transforms: {
      // Extract file content as base64
      content: (filePath: unknown): string => {
        if (typeof filePath !== 'string') {
          throw new Error('file_path must be a string');
        }
        
        if (!fs.existsSync(filePath)) {
          throw new Error(`File not found: ${filePath}`);
        }

        const fileContent = fs.readFileSync(filePath);
        return fileContent.toString('base64');
      },

      // Extract filename
      name: (filePath: unknown): string => {
        if (typeof filePath !== 'string') {
          throw new Error('file_path must be a string');
        }
        return path.basename(filePath);
      },

      // Extract file format
      file_format: (filePath: unknown): { value: string } => {
        if (typeof filePath !== 'string') {
          throw new Error('file_path must be a string');
        }
        const extension = path.extname(filePath).slice(1);
        return { value: extension || 'txt' };
      }
    }
  });

  return mapper;
};

/**
 * EXPERIMENTAL: User data transformations
 */
const createExperimental_UserDataTransformations = (): Experimental_ParameterMapper => {
  const mapper = new Experimental_ParameterMapper();

  // Transform full_name to first_name and last_name
  mapper.addTransformer('full_name', {
    transforms: {
      first_name: (fullName: unknown): string => {
        if (typeof fullName !== 'string') {
          throw new Error('full_name must be a string');
        }
        const parts = fullName.trim().split(/\s+/);
        return parts[0] || '';
      },

      last_name: (fullName: unknown): string => {
        if (typeof fullName !== 'string') {
          throw new Error('full_name must be a string');
        }
        const parts = fullName.trim().split(/\s+/);
        return parts.slice(1).join(' ') || '';
      }
    }
  });

  // Transform email to username and domain
  mapper.addTransformer('email', {
    transforms: {
      username: (email: unknown): string => {
        if (typeof email !== 'string') {
          throw new Error('email must be a string');
        }
        const [username] = email.split('@');
        return username || '';
      },

      email_domain: (email: unknown): string => {
        if (typeof email !== 'string') {
          throw new Error('email must be a string');
        }
        const [, domain] = email.split('@');
        return domain || '';
      }
    }
  });

  return mapper;
};

/**
 * EXPERIMENTAL: Date formatting transformations
 */
const createExperimental_DateTransformations = (): Experimental_ParameterMapper => {
  const mapper = new Experimental_ParameterMapper();

  // Transform date_string to various formats
  mapper.addTransformer('date_string', {
    transforms: {
      start_date: (dateString: unknown): string => {
        if (typeof dateString !== 'string') {
          throw new Error('date_string must be a string');
        }
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date format');
        }
        return date.toISOString().split('T')[0]; // YYYY-MM-DD format
      },

      formatted_date: (dateString: unknown): { value: string } => {
        if (typeof dateString !== 'string') {
          throw new Error('date_string must be a string');
        }
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date format');
        }
        return { value: date.toLocaleDateString('en-US') }; // MM/DD/YYYY format
      }
    }
  });

  return mapper;
};

const experimentalTransformationsExample = async (): Promise<void> => {
  // Create a sample file for testing
  const sampleFilePath = path.join(__dirname, 'sample-transform-file.txt');
  fs.writeFileSync(sampleFilePath, 'This is a test file for experimental transformations.');

  try {
    // Initialize the StackOne toolset
    const toolset = new StackOneToolSet();

    // Get tools for testing
    const tools = toolset.getStackOneTools('hris_*', accountId);

    console.log('🧪 Testing EXPERIMENTAL file transformations...');

    // EXPERIMENTAL: Create file transformation mapper
    const fileMapper = createExperimental_FileTransformations();
    const filePreExecute = fileMapper.createPreExecuteFunction();

    // Get the upload file tool
    const uploadTool = tools.getTool('hris_upload_employee_document');
    assert(uploadTool !== undefined, 'Upload document tool not found');

    // Test file transformations
    const fileResult = await uploadTool.execute(
      {
        file_path: sampleFilePath, // Will be transformed to content, name, file_format
        id: 'c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA',
        category: { value: 'shared' },
      },
      {
        dryRun: true,
        experimental_PreExecute: filePreExecute,
      }
    );

    console.log('✅ File transformations successful');
    const fileParams = fileResult.mappedParams as Record<string, unknown>;
    assert(typeof fileParams.content === 'string', 'Content should be base64 string');
    assert(fileParams.name === 'sample-transform-file.txt', 'Filename not extracted correctly');
    assert(
      (fileParams.file_format as { value: string }).value === 'txt',
      'File format not extracted correctly'
    );

    console.log('🧪 Testing EXPERIMENTAL user data transformations...');

    // EXPERIMENTAL: Create user data transformation mapper
    const userMapper = createExperimental_UserDataTransformations();
    const userPreExecute = userMapper.createPreExecuteFunction();

    // Get a tool that might use user data
    const employeeTool = tools.getTool('hris_create_employee');
    assert(employeeTool !== undefined, 'Create employee tool not found');

    // Test user data transformations
    const userResult = await employeeTool.execute(
      {
        full_name: 'John William Smith', // Will be transformed to first_name, last_name
        email: 'john.smith@company.com', // Will be transformed to username, email_domain
        employment_status: { value: 'active' },
      },
      {
        dryRun: true,
        experimental_PreExecute: userPreExecute,
      }
    );

    console.log('✅ User data transformations successful');
    const userParams = userResult.mappedParams as Record<string, unknown>;
    assert(userParams.first_name === 'John', 'First name not extracted correctly');
    assert(userParams.last_name === 'William Smith', 'Last name not extracted correctly');
    assert(userParams.username === 'john.smith', 'Username not extracted correctly');
    assert(userParams.email_domain === 'company.com', 'Email domain not extracted correctly');

    console.log('🧪 Testing EXPERIMENTAL date transformations...');

    // EXPERIMENTAL: Create date transformation mapper
    const dateMapper = createExperimental_DateTransformations();
    const datePreExecute = dateMapper.createPreExecuteFunction();

    // Test date transformations
    const testParams = {
      date_string: '2024-01-15T10:30:00Z', // Will be transformed to start_date, formatted_date
      other_param: 'unchanged',
    };

    const dateResult = await datePreExecute(testParams);

    console.log('✅ Date transformations successful');
    assert(dateResult.start_date === '2024-01-15', 'Start date not formatted correctly');
    assert(
      (dateResult.formatted_date as { value: string }).value === '1/15/2024',
      'Formatted date not created correctly'
    );
    assert(dateResult.other_param === 'unchanged', 'Other parameters should remain unchanged');

    console.log('🧪 Testing EXPERIMENTAL composite transformations...');

    // EXPERIMENTAL: Combine multiple transformations
    const compositePreExecute = async (params: JsonDict): Promise<JsonDict> => {
      let result = params;

      // Apply file transformations if file_path exists
      if (result.file_path) {
        const fileMapper = createExperimental_FileTransformations();
        const fileTransform = fileMapper.createPreExecuteFunction();
        result = await fileTransform(result);
      }

      // Apply user transformations if full_name or email exists
      if (result.full_name || result.email) {
        const userMapper = createExperimental_UserDataTransformations();
        const userTransform = userMapper.createPreExecuteFunction();
        result = await userTransform(result);
      }

      // Apply date transformations if date_string exists
      if (result.date_string) {
        const dateMapper = createExperimental_DateTransformations();
        const dateTransform = dateMapper.createPreExecuteFunction();
        result = await dateTransform(result);
      }

      return result;
    };

    // Test composite transformations
    const compositeResult = await compositePreExecute({
      file_path: sampleFilePath,
      full_name: 'Jane Doe',
      email: 'jane@example.com',
      date_string: '2024-02-20T15:00:00Z',
      unchanged_param: 'stays the same',
    });

    console.log('✅ Composite transformations successful');
    assert(typeof compositeResult.content === 'string', 'File content should be transformed');
    assert(compositeResult.first_name === 'Jane', 'Name should be transformed');
    assert(compositeResult.username === 'jane', 'Email should be transformed');
    assert(compositeResult.start_date === '2024-02-20', 'Date should be transformed');
    assert(compositeResult.unchanged_param === 'stays the same', 'Other params should remain');

    console.log('🎉 All EXPERIMENTAL transformation tests passed!');
    console.log('');
    console.log('🔄 Transformation Comparison:');
    console.log('   Current API: ParameterMapper with static configuration');
    console.log('   Experimental API: Dynamic preExecute functions with async support');
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

experimentalTransformationsExample();