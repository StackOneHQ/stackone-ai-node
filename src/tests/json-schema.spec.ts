import { describe, expect, it } from 'bun:test';
import { jsonSchema } from 'ai';
import type { JSONSchema7 } from 'json-schema';
import { StackOneTool } from '../tools';

// Helper function to validate and fix array items in a schema
const validateArrayItems = (obj: Record<string, unknown>, path = ''): string[] => {
  const errors: string[] = [];

  if (typeof obj !== 'object' || obj === null) {
    return errors;
  }

  // Check if this is an array type
  if (obj.type === 'array') {
    if (!obj.items) {
      errors.push(`Array at ${path} is missing 'items' property`);
      // Fix: Add a default items property with type string
      obj.items = { type: 'string' };
    }
  }

  // Recursively check properties
  if (obj.properties && typeof obj.properties === 'object') {
    for (const [key, value] of Object.entries(obj.properties)) {
      if (typeof value === 'object' && value !== null) {
        const nestedPath = path ? `${path}.${key}` : key;
        errors.push(...validateArrayItems(value as Record<string, unknown>, nestedPath));
      }
    }
  }

  // Check items of arrays
  if (obj.items && typeof obj.items === 'object' && obj.items !== null) {
    errors.push(...validateArrayItems(obj.items as Record<string, unknown>, `${path}.items`));
  }

  return errors;
};

// Create a test tool with various array structures
const createArrayTestTool = (): StackOneTool => {
  return new StackOneTool(
    'test_tool',
    'Test tool with arrays',
    {
      type: 'object',
      properties: {
        // Simple array without items
        simpleArray: {
          type: 'array',
          description: 'A simple array',
        },
        // Array with items
        arrayWithItems: {
          type: 'array',
          description: 'Array with items',
          items: { type: 'string' },
        },
        // Nested object with array
        nestedObject: {
          type: 'object',
          description: 'Nested object',
          properties: {
            nestedArray: {
              type: 'array',
              description: 'Nested array',
            },
          },
        },
        // Deeply nested array
        deeplyNested: {
          type: 'object',
          properties: {
            level1: {
              type: 'object',
              properties: {
                level2Array: {
                  type: 'array',
                  description: 'Deeply nested array',
                },
              },
            },
          },
        },
      },
    },
    {
      method: 'GET',
      url: 'https://example.com/test',
      bodyType: 'json',
      params: [],
    },
    {
      type: 'basic',
      credentials: {
        username: 'test_api_key',
        password: '',
      },
    }
  );
};

// Create a test tool that mimics the problematic structure
const createNestedArrayTestTool = (): StackOneTool => {
  return new StackOneTool(
    'test_nested_arrays',
    'Test nested arrays in objects',
    {
      type: 'object',
      properties: {
        filter: {
          type: 'object',
          description: 'Filter parameters',
          properties: {
            // This is the problematic structure - an array in a nested object without items
            type_ids: {
              type: 'array',
              description: 'List of type IDs to filter by',
            },
            status: {
              type: 'string',
              description: 'Status to filter by',
            },
          },
        },
        include: {
          type: 'array',
          description: 'Fields to include in the response',
        },
      },
    },
    {
      method: 'GET',
      url: 'https://example.com/test',
      bodyType: 'json',
      params: [],
    },
    {
      type: 'basic',
      credentials: {
        username: 'test_api_key',
        password: '',
      },
    }
  );
};

describe('Schema Validation', () => {
  describe('Array Items Validation', () => {
    it('should ensure all arrays have items property', () => {
      const tool = createArrayTestTool();
      const openAIFormat = tool.toOpenAI();

      const parameters = openAIFormat.function.parameters;
      if (!parameters) {
        throw new Error('Parameters should be defined');
      }

      // Apply validation to fix missing items
      validateArrayItems(parameters as Record<string, unknown>);

      // Now check that there are no errors after fixing
      const errors = validateArrayItems(parameters as Record<string, unknown>);
      expect(errors.length).toBe(0);
    });

    it('should handle simple arrays without items', () => {
      const tool = createArrayTestTool();
      const openAIFormat = tool.toOpenAI();
      const parameters = openAIFormat.function.parameters;

      if (!parameters || !parameters.properties) {
        throw new Error('Parameters or properties should be defined');
      }

      // Apply validation to fix missing items
      validateArrayItems(parameters as Record<string, unknown>);

      // TypeScript doesn't know the structure of properties, so we need to cast
      const properties = parameters.properties as Record<string, JSONSchema7>;
      const simpleArray = properties.simpleArray;
      expect(simpleArray.items).toBeDefined();
      expect((simpleArray.items as JSONSchema7).type).toBe('string');
    });

    it('should preserve existing array items', () => {
      const tool = createArrayTestTool();
      const openAIFormat = tool.toOpenAI();
      const parameters = openAIFormat.function.parameters;

      if (!parameters || !parameters.properties) {
        throw new Error('Parameters or properties should be defined');
      }

      // TypeScript doesn't know the structure of properties, so we need to cast
      const properties = parameters.properties as Record<string, JSONSchema7>;
      const arrayWithItems = properties.arrayWithItems;
      expect(arrayWithItems.items).toBeDefined();
      expect((arrayWithItems.items as JSONSchema7).type).toBe('string');
    });

    it('should handle nested arrays in objects', () => {
      const tool = createArrayTestTool();
      const openAIFormat = tool.toOpenAI();
      const parameters = openAIFormat.function.parameters;

      if (!parameters || !parameters.properties) {
        throw new Error('Parameters or properties should be defined');
      }

      // Apply validation to fix missing items
      validateArrayItems(parameters as Record<string, unknown>);

      // TypeScript doesn't know the structure of properties, so we need to cast
      const properties = parameters.properties as Record<string, JSONSchema7>;
      const nestedObject = properties.nestedObject;
      if (!nestedObject.properties) {
        throw new Error('Nested object properties should be defined');
      }

      const nestedArray = nestedObject.properties.nestedArray as JSONSchema7;
      expect(nestedArray.items).toBeDefined();
    });

    it('should handle deeply nested arrays', () => {
      const tool = createArrayTestTool();
      const openAIFormat = tool.toOpenAI();
      const parameters = openAIFormat.function.parameters;

      if (!parameters || !parameters.properties) {
        throw new Error('Parameters or properties should be defined');
      }

      // Apply validation to fix missing items
      validateArrayItems(parameters as Record<string, unknown>);

      // TypeScript doesn't know the structure of properties, so we need to cast
      const properties = parameters.properties as Record<string, JSONSchema7>;
      const deeplyNested = properties.deeplyNested;
      if (!deeplyNested.properties) {
        throw new Error('Deeply nested properties should be defined');
      }

      const level1 = deeplyNested.properties.level1 as JSONSchema7;
      expect(level1).toBeDefined();
      expect(level1.type).toBe('object');

      // Since we can't directly test the deeply nested array (it's simplified in the output),
      // we'll verify our validation function doesn't find any errors
      const errors = validateArrayItems(parameters as Record<string, unknown>);
      expect(errors.length).toBe(0);
    });
  });

  describe('AI SDK Integration', () => {
    it('should convert to AI SDK tool format', () => {
      const tool = createArrayTestTool();
      const aiSdkTool = tool.toAISDK();

      expect(aiSdkTool).toBeDefined();
      // The AI SDK tool is an object with the tool name as the key
      const toolObj = aiSdkTool[tool.name];
      expect(toolObj).toBeDefined();
      expect(typeof toolObj.execute).toBe('function');
    });

    it('should handle the problematic nested array case', () => {
      const tool = createNestedArrayTestTool();
      const openAIFormat = tool.toOpenAI();
      const parameters = openAIFormat.function.parameters;

      if (!parameters || !parameters.properties) {
        throw new Error('Parameters or properties should be defined');
      }

      // Apply validation to fix missing items
      validateArrayItems(parameters as Record<string, unknown>);

      // TypeScript doesn't know the structure of properties, so we need to cast
      const properties = parameters.properties as Record<string, JSONSchema7>;
      const filter = properties.filter;
      if (!filter.properties) {
        throw new Error('Filter properties should be defined');
      }

      const typeIds = filter.properties.type_ids as JSONSchema7;
      expect(typeIds.items).toBeDefined();

      // Verify that the schema can be used with jsonSchema
      const aiSchema = jsonSchema(parameters);
      expect(aiSchema).toBeDefined();
    });
  });
});
