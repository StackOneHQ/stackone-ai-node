/**
 * Example tests - each example is tested individually with MSW mocking
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openai } from '@ai-sdk/openai';
import {
  type Experimental_PreExecuteFunction,
  type Experimental_SchemaOverride,
  OpenAPIToolSet,
  StackOneToolSet,
  ToolSetConfigError,
  Tools,
} from '@stackone/ai';
import { generateText } from 'ai';
import type { JSONSchema7Definition } from 'json-schema';
import OpenAI from 'openai';
import { ACCOUNT_IDS } from './constants';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================
// index.ts - Quickstart example
// ============================================================
describe('index.ts - Quickstart', () => {
  it('should get HRIS tools and list employees', async () => {
    const toolset = new StackOneToolSet();
    const accountId = ACCOUNT_IDS.HRIS;

    const tools = toolset.getStackOneTools('hris_*', accountId);
    expect(tools.length).toBeGreaterThan(0);

    const employeeTool = tools.getTool('hris_list_employees');
    expect(employeeTool).toBeDefined();

    const result = await employeeTool?.execute();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);
  });
});

// ============================================================
// openai-integration.ts - OpenAI integration example
// ============================================================
describe('openai-integration.ts - OpenAI Integration', () => {
  it('should use StackOne tools with OpenAI', async () => {
    const toolset = new StackOneToolSet();
    const accountId = ACCOUNT_IDS.HRIS;

    const tools = toolset.getStackOneTools('hris_get_*', accountId);
    const openAITools = tools.toOpenAI();

    const openaiClient = new OpenAI();

    const response = await openaiClient.chat.completions.create({
      model: 'gpt-5',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that can access HRIS information.',
        },
        {
          role: 'user',
          content:
            'What is the employee with id: c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA phone number?',
        },
      ],
      tools: openAITools,
    });

    expect(response.choices.length).toBeGreaterThan(0);

    const choice = response.choices[0];
    expect(choice.message.tool_calls).toBeDefined();
    expect(choice.message.tool_calls?.length).toBeGreaterThan(0);

    const toolCall = choice.message.tool_calls?.[0];
    expect(toolCall.function.name).toBe('hris_get_employee');

    const args = JSON.parse(toolCall.function.arguments);
    expect(args.id).toBe('c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA');
  });
});

// ============================================================
// ai-sdk-integration.ts - AI SDK integration example
// ============================================================
describe('ai-sdk-integration.ts - AI SDK Integration', () => {
  it('should use StackOne tools with AI SDK', async () => {
    const toolset = new StackOneToolSet();
    const accountId = ACCOUNT_IDS.HRIS;

    const tools = toolset.getStackOneTools('hris_get_*', accountId);
    const aiSdkTools = await tools.toAISDK();

    const { text } = await generateText({
      model: openai('gpt-5'),
      tools: aiSdkTools,
      prompt: 'Get all details about employee with id: c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA',
      maxSteps: 3,
    });

    expect(text).toContain('Michael');
  });
});

// ============================================================
// human-in-the-loop.ts - Human-in-the-loop example
// ============================================================
describe('human-in-the-loop.ts - Human in the Loop', () => {
  it('should support non-executable tool creation for human validation', async () => {
    const toolset = new StackOneToolSet();
    const hrisAccountId = ACCOUNT_IDS.HRIS;

    const createEmployeeTool = toolset.getTool('hris_create_employee', {
      'x-account-id': hrisAccountId,
    });

    expect(createEmployeeTool).toBeDefined();

    // Test that we can create a non-executable tool (for human-in-the-loop workflows)
    const tool = await createEmployeeTool?.toAISDK({
      executable: false,
    });

    // Verify the tool is created and has expected structure
    expect(tool).toBeDefined();
    expect(tool.hris_create_employee).toBeDefined();
    expect(tool.hris_create_employee.parameters).toBeDefined();

    // The tool should NOT have an execute function when executable: false
    // This allows humans to validate the arguments before execution
    expect(typeof tool.hris_create_employee.execute).toBe('undefined');
  });

  it('should allow manual execution after validation', async () => {
    const toolset = new StackOneToolSet();
    const hrisAccountId = ACCOUNT_IDS.HRIS;

    const createEmployeeTool = toolset.getTool('hris_create_employee', {
      'x-account-id': hrisAccountId,
    });

    expect(createEmployeeTool).toBeDefined();

    // Simulate human-validated parameters
    const validatedParams = {
      name: 'John Doe',
      personal_email: 'john.doe@example.com',
      department: 'Engineering',
      start_date: '2025-01-01',
      hire_date: '2025-01-01',
    };

    // Execute with validated params (using dryRun to avoid actual API call)
    const result = await createEmployeeTool?.execute(validatedParams, { dryRun: true });
    expect(result).toBeDefined();
  });
});

// ============================================================
// error-handling.ts - Error handling example
// ============================================================
describe('error-handling.ts - Error Handling', () => {
  it('should handle initialization errors with strict mode', () => {
    vi.stubEnv('STACKONE_API_KEY', '');

    expect(() => {
      new StackOneToolSet({ strict: true });
    }).toThrow(ToolSetConfigError);

    vi.unstubAllEnvs();
  });

  it('should handle API errors with invalid account ID', async () => {
    const toolset = new StackOneToolSet();
    const accountId = ACCOUNT_IDS.TEST.INVALID;

    const tools = toolset.getStackOneTools('hris_*', accountId);
    const employeeTool = tools.getTool('hris_list_employees');

    expect(employeeTool).toBeDefined();

    await expect(employeeTool?.execute()).rejects.toThrow();
  });

  it('should handle invalid tool name', async () => {
    const toolset = new StackOneToolSet();
    const tools = toolset.getTools('hris_*');
    const nonExistentTool = tools.getTool('non_existent_tool');

    expect(nonExistentTool).toBeUndefined();
  });

  it('should return response even without required id parameter', async () => {
    // Note: The SDK returns a placeholder response when id is missing
    // In a real API call this would fail, but with MSW mock it succeeds
    const toolset = new StackOneToolSet();
    const tools = toolset.getTools('hris_*');
    const employeeTool = tools.getTool('hris_get_employee');

    expect(employeeTool).toBeDefined();

    // The mock handler returns a response with {id} placeholder
    const result = await employeeTool?.execute();
    expect(result).toBeDefined();
  });
});

// ============================================================
// openapi-toolset.ts - OpenAPI Toolset example
// ============================================================
describe('openapi-toolset.ts - OpenAPI Toolset', () => {
  type DryRunResult = {
    url: string;
    method: string;
    headers?: Record<string, string>;
    body?: string;
  };

  it('should load OpenAPI spec from a file', async () => {
    const toolset = new OpenAPIToolSet({
      filePath: path.join(
        process.cwd(),
        '..',
        'src',
        'toolsets',
        'tests',
        'fixtures',
        'petstore.json'
      ),
    });

    const tools = toolset.getTools('*Pet*');
    expect(tools.length).toBeGreaterThan(0);

    const getPetTool = tools.getTool('getPetById');
    expect(getPetTool).toBeDefined();

    const result = (await getPetTool?.execute({ petId: 123 }, { dryRun: true })) as DryRunResult;

    expect(result).toBeDefined();
    expect(result.url).toContain('/pet/123');
    expect(result.method).toBe('GET');
  });

  it('should load OpenAPI spec from a URL', async () => {
    const toolset = await OpenAPIToolSet.fromUrl({
      url: 'https://api.eu1.stackone.com/oas/hris.json',
    });

    const hrisTools = toolset.getTools('hris_*');
    expect(hrisTools.length).toBeGreaterThan(0);

    const getEmployeeTool = hrisTools.getTool('hris_get_employee');
    expect(getEmployeeTool).toBeDefined();
    expect(
      typeof getEmployeeTool?.parameters.properties.id === 'object' &&
        getEmployeeTool?.parameters.properties.id !== null &&
        getEmployeeTool?.parameters.properties.id.type === 'string'
    ).toBe(true);

    const result = (await getEmployeeTool?.execute({ id: 123 }, { dryRun: true })) as DryRunResult;

    expect(result).toBeDefined();
    expect(result.method).toBe('GET');
    expect(result.url).toContain('/employees/123');
    expect(result.body).toBeUndefined();
  });
});

// ============================================================
// fetch-tools.ts - Fetch Tools example
// Note: fetchTools uses MCP which requires real API access,
// so we test the toolset configuration and local tool retrieval instead
// ============================================================
describe('fetch-tools.ts - Fetch Tools', () => {
  it('should create toolset with custom base URL', async () => {
    const toolset = new StackOneToolSet({
      baseUrl: 'https://api.stackone.com',
    });

    // Verify toolset is created successfully
    expect(toolset).toBeDefined();

    // Can get local tools
    const tools = toolset.getTools('hris_*');
    expect(tools.length).toBeGreaterThan(0);
  });

  it('should support setAccounts method', async () => {
    const toolset = new StackOneToolSet({
      baseUrl: 'https://api.stackone.com',
    });

    // setAccounts should not throw
    toolset.setAccounts(['account-123', 'account-456']);

    // Can still get tools after setting accounts
    const tools = toolset.getTools('hris_*');
    expect(tools.length).toBeGreaterThan(0);
  });

  it('should support getting tools with various filters', async () => {
    const toolset = new StackOneToolSet({
      baseUrl: 'https://api.stackone.com',
    });

    // Test different filter patterns
    const hrisTools = toolset.getTools('hris_*');
    expect(hrisTools.length).toBeGreaterThan(0);

    const listTools = toolset.getTools('*_list_*');
    expect(listTools.length).toBeGreaterThan(0);
  });
});

// ============================================================
// experimental-document-handling.ts - Experimental Document Handling
// ============================================================
describe('experimental-document-handling.ts - Document Handling', () => {
  interface FileFormatParam {
    value: string;
  }

  interface DocumentParams {
    content: string;
    name: string;
    file_format: FileFormatParam;
    [key: string]: unknown;
  }

  const createDocumentSchemaOverride = (): Experimental_SchemaOverride => {
    return (originalSchema) => {
      const newProperties: Record<string, JSONSchema7Definition> = {};

      for (const [key, value] of Object.entries(originalSchema.properties)) {
        if (!['content', 'name', 'file_format'].includes(key)) {
          newProperties[key] = value;
        }
      }

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

  const createDocumentPreExecute = (allowedPaths: string[]): Experimental_PreExecuteFunction => {
    return async (params) => {
      const { doc_id, ...otherParams } = params;

      if (typeof doc_id !== 'string') {
        throw new Error('doc_id must be a string');
      }

      const isAllowed = allowedPaths.some((allowedPath) => doc_id.startsWith(allowedPath));

      if (!isAllowed) {
        throw new Error(`Document path not allowed: ${doc_id}`);
      }

      if (!fs.existsSync(doc_id)) {
        throw new Error(`Document not found: ${doc_id}`);
      }

      const fileContent = fs.readFileSync(doc_id);
      const base64Content = fileContent.toString('base64');
      const fileName = path.basename(doc_id);
      const extension = path.extname(doc_id).slice(1);

      return {
        ...otherParams,
        content: base64Content,
        name: fileName,
        file_format: { value: extension },
      };
    };
  };

  it('should handle document upload with schema override and preExecute', async () => {
    const sampleFilePath = path.join(__dirname, 'sample-document.txt');
    fs.writeFileSync(sampleFilePath, 'This is an experimental document handling test file.');

    const toolset = new StackOneToolSet();
    const accountId = ACCOUNT_IDS.HRIS;

    const tools = toolset.getStackOneTools('hris_*', accountId);

    const localDocumentTool = tools.getTool('hris_upload_employee_document', {
      experimental_schemaOverride: createDocumentSchemaOverride(),
      experimental_preExecute: createDocumentPreExecute([__dirname]),
    });

    assert(localDocumentTool);

    const localFileResult = await localDocumentTool.execute(
      {
        doc_id: sampleFilePath,
        id: 'c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA',
        category: { value: 'shared' },
      },
      {
        dryRun: true,
      }
    );

    fs.unlinkSync(sampleFilePath);

    const localParams = localFileResult.mappedParams as Record<string, unknown>;
    const localDocumentParams = localParams as DocumentParams & Record<string, unknown>;
    expect(localDocumentParams.file_format?.value).toBe('txt');
    expect(localDocumentParams.name).toBe('sample-document.txt');
    expect(typeof localDocumentParams.content).toBe('string');
  });
});

// ============================================================
// filters.ts - Filters example
// ============================================================
describe('filters.ts - HRIS Filters', () => {
  type DryRunResult = { url: string };

  it('should serialize date filter correctly', async () => {
    const toolset = new StackOneToolSet();
    const accountId = ACCOUNT_IDS.TEST.VALID;

    const tools = toolset.getStackOneTools('hris_*', accountId);
    const employeesTool = tools.getTool('hris_list_employees');

    expect(employeesTool).toBeDefined();

    const basicDateFilter = (await employeesTool?.execute(
      {
        filter: {
          updated_after: '2023-01-01T00:00:00.000Z',
        },
      },
      { dryRun: true }
    )) as DryRunResult;

    expect(basicDateFilter.url).toContain('filter%5Bupdated_after%5D=2023-01-01T00%3A00%3A00.000Z');
  });

  it('should serialize email filter correctly', async () => {
    const toolset = new StackOneToolSet();
    const accountId = ACCOUNT_IDS.TEST.VALID;

    const tools = toolset.getStackOneTools('hris_*', accountId);
    const employeesTool = tools.getTool('hris_list_employees');

    const emailFilter = (await employeesTool?.execute(
      {
        filter: {
          email: 'john.doe@company.com',
        },
      },
      { dryRun: true }
    )) as DryRunResult;

    expect(emailFilter.url).toContain('filter%5Bemail%5D=john.doe%40company.com');
  });

  it('should serialize multiple filters correctly', async () => {
    const toolset = new StackOneToolSet();
    const accountId = ACCOUNT_IDS.TEST.VALID;

    const tools = toolset.getStackOneTools('hris_*', accountId);
    const employeesTool = tools.getTool('hris_list_employees');

    const multipleFilters = (await employeesTool?.execute(
      {
        filter: {
          updated_after: '2023-06-01T00:00:00.000Z',
          email: 'jane.smith@company.com',
          employee_number: 'EMP002',
        },
      },
      { dryRun: true }
    )) as DryRunResult;

    expect(multipleFilters.url).toContain('filter%5Bupdated_after%5D=2023-06-01T00%3A00%3A00.000Z');
    expect(multipleFilters.url).toContain('filter%5Bemail%5D=jane.smith%40company.com');
    expect(multipleFilters.url).toContain('filter%5Bemployee_number%5D=EMP002');
  });

  it('should serialize proxy parameters correctly', async () => {
    const toolset = new StackOneToolSet();
    const accountId = ACCOUNT_IDS.TEST.VALID;

    const tools = toolset.getStackOneTools('hris_*', accountId);
    const employeesTool = tools.getTool('hris_list_employees');

    const proxyParameters = (await employeesTool?.execute(
      {
        proxy: {
          custom_field: 'value123',
          provider_filter: {
            department: 'Engineering',
            status: 'active',
          },
        },
      },
      { dryRun: true }
    )) as DryRunResult;

    expect(proxyParameters.url).toContain('proxy%5Bcustom_field%5D=value123');
    expect(proxyParameters.url).toContain('proxy%5Bprovider_filter%5D%5Bdepartment%5D=Engineering');
    expect(proxyParameters.url).toContain('proxy%5Bprovider_filter%5D%5Bstatus%5D=active');
  });
});

// ============================================================
// account-id-usage.ts - Account ID Usage example
// ============================================================
describe('account-id-usage.ts - Account ID Usage', () => {
  it('should set account ID on toolset initialization', async () => {
    const toolset = new StackOneToolSet({ accountId: ACCOUNT_IDS.TEST.VALID });

    const tools = toolset.getTools('hris_*');
    const employeeTool = tools.getStackOneTool('hris_list_employees');

    expect(employeeTool.getAccountId()).toBe(ACCOUNT_IDS.TEST.VALID);
  });

  it('should override account ID when getting tools', async () => {
    const toolset = new StackOneToolSet({ accountId: ACCOUNT_IDS.TEST.VALID });

    const toolsWithOverride = toolset.getStackOneTools('hris_*', ACCOUNT_IDS.TEST.OVERRIDE);
    const employeeToolWithOverride = toolsWithOverride.getStackOneTool('hris_list_employees');

    expect(employeeToolWithOverride?.getAccountId()).toBe(ACCOUNT_IDS.TEST.OVERRIDE);
  });

  it('should set account ID directly on the tool', async () => {
    const toolset = new StackOneToolSet({ accountId: ACCOUNT_IDS.TEST.VALID });

    const tools = toolset.getTools('hris_*');
    const employeeTool = tools.getStackOneTool('hris_list_employees');

    employeeTool.setAccountId(ACCOUNT_IDS.TEST.DIRECT);

    expect(employeeTool.getAccountId()).toBe(ACCOUNT_IDS.TEST.DIRECT);
  });
});

// ============================================================
// custom-base-url.ts - Custom Base URL example
// ============================================================
describe('custom-base-url.ts - Custom Base URL', () => {
  it('should use default base URL', async () => {
    const defaultToolset = new StackOneToolSet();
    const hrisTools = defaultToolset.getTools('hris_*');

    expect(hrisTools.length).toBeGreaterThan(0);

    const defaultTool = hrisTools.getTool('hris_get_employee');
    expect(defaultTool).toBeDefined();
    expect(defaultTool?.executeConfig.url).toContain('https://api.stackone.com');
  });

  it('should use custom base URL', async () => {
    const devToolset = new StackOneToolSet({
      baseUrl: 'https://api.example-dev.com',
    });

    const devHrisTools = devToolset.getTools('hris_*');

    expect(devHrisTools.length).toBeGreaterThan(0);

    const devTool = devHrisTools.getTool('hris_get_employee');
    expect(devTool).toBeDefined();
    expect(devTool?.executeConfig.url).toContain('https://api.example-dev.com');
  });
});

// ============================================================
// meta-tools.ts - Meta Tools example
// ============================================================
describe('meta-tools.ts - Meta Tools', () => {
  it('should search for tools using meta_search_tools', async () => {
    const toolset = new StackOneToolSet();
    const accountId = ACCOUNT_IDS.HRIS;

    const allTools = toolset.getStackOneTools('*', accountId);
    const metaTools = await allTools.metaTools();

    const filterTool = metaTools.getTool('meta_search_tools');
    expect(filterTool).toBeDefined();

    const searchResult = await filterTool?.execute({
      query: 'employee management create update list',
      limit: 5,
      minScore: 0.3,
    });

    const foundTools = searchResult.tools as Array<{
      name: string;
      description: string;
      score: number;
    }>;

    expect(foundTools.length).toBeGreaterThan(0);
  });

  it('should have meta_execute_tool available', async () => {
    const toolset = new StackOneToolSet();
    const accountId = ACCOUNT_IDS.HRIS;

    const allTools = toolset.getStackOneTools('*', accountId);
    const metaTools = await allTools.metaTools();

    const executeTool = metaTools.getTool('meta_execute_tool');
    expect(executeTool).toBeDefined();
    expect(executeTool?.name).toBe('meta_execute_tool');
    expect(executeTool?.description).toBeDefined();
  });

  it('should work with combined tools from multiple categories', async () => {
    const toolset = new StackOneToolSet();
    const accountId = ACCOUNT_IDS.HRIS;

    const hrisTools = toolset.getStackOneTools('hris_*', accountId);
    const atsTools = toolset.getStackOneTools('ats_*', accountId);

    const combinedTools = new Tools([...hrisTools.toArray(), ...atsTools.toArray()]);

    const metaTools = await combinedTools.metaTools();

    expect(metaTools.getTool('meta_search_tools')).toBeDefined();
    expect(metaTools.getTool('meta_execute_tool')).toBeDefined();
  });
});

// ============================================================
// planning.ts - Planning example (just verifies module loads)
// ============================================================
describe('planning.ts - Planning Module', () => {
  it('should export planningModule function', async () => {
    // Planning module is in closed beta, so we just verify the module structure
    // The actual plan() method would require real API access
    const toolset = new StackOneToolSet();
    expect(typeof toolset.plan).toBe('function');
  });
});
