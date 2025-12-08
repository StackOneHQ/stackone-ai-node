import { jsonSchema } from 'ai';
import type { JSONSchema7 } from 'json-schema';
import { StackOneTool } from '../tool';

describe('Schema Validation', () => {
  describe('Array Items in Schema', () => {
    it('should preserve array items when provided', () => {
      const tool = new StackOneTool(
        'test_tool',
        'Test tool',
        {
          type: 'object',
          properties: {
            arrayWithItems: {
              type: 'array',
              description: 'Array with items',
              items: { type: 'number' },
            },
          },
        },
        {
          kind: 'http',
          method: 'GET',
          url: 'https://example.com/test',
          bodyType: 'json',
          params: [],
        },
        { authorization: 'Bearer test_api_key' }
      );

      const parameters = tool.toOpenAI().function.parameters;
      expect(parameters).toBeDefined();
      const properties = parameters?.properties as Record<string, JSONSchema7>;

      expect(properties.arrayWithItems.items).toBeDefined();
      expect((properties.arrayWithItems.items as JSONSchema7).type).toBe('number');
    });

    it('should handle nested object structure', () => {
      const tool = new StackOneTool(
        'test_tool',
        'Test tool',
        {
          type: 'object',
          properties: {
            nestedObject: {
              type: 'object',
              properties: {
                nestedArray: {
                  type: 'array',
                  items: { type: 'string' },
                },
              },
            },
          },
        },
        {
          kind: 'http',
          method: 'GET',
          url: 'https://example.com/test',
          bodyType: 'json',
          params: [],
        },
        { authorization: 'Bearer test_api_key' }
      );

      const parameters = tool.toOpenAI().function.parameters;
      expect(parameters).toBeDefined();
      const properties = parameters?.properties as Record<string, JSONSchema7>;
      const nestedObject = properties.nestedObject;

      expect(nestedObject.type).toBe('object');
      expect(nestedObject.properties).toBeDefined();
    });
  });

  describe('AI SDK Integration', () => {
    it('should convert to AI SDK tool format with correct schema structure', async () => {
      const tool = new StackOneTool(
        'test_tool',
        'Test tool with arrays',
        {
          type: 'object',
          properties: {
            arrayWithItems: { type: 'array', items: { type: 'string' } },
          },
        },
        {
          kind: 'http',
          method: 'GET',
          url: 'https://example.com/test',
          bodyType: 'json',
          params: [],
        },
        { authorization: 'Bearer test_api_key' }
      );

      const aiSdkTool = await tool.toAISDK();
      const toolObj = aiSdkTool[tool.name];

      expect(toolObj).toBeDefined();
      expect(typeof toolObj.execute).toBe('function');
      // TODO: Remove ts-ignore once AISDKToolDefinition properly types inputSchema.jsonSchema
      // @ts-ignore - jsonSchema is available on Schema wrapper from ai sdk
      expect(toolObj.inputSchema.jsonSchema.type).toBe('object');

      // @ts-ignore - jsonSchema is available on Schema wrapper from ai sdk
      const arrayWithItems = toolObj.inputSchema.jsonSchema.properties?.arrayWithItems;
      expect(arrayWithItems?.type).toBe('array');
      expect((arrayWithItems?.items as JSONSchema7)?.type).toBe('string');
    });

    it('should handle nested filter object for AI SDK', async () => {
      const tool = new StackOneTool(
        'test_nested_arrays',
        'Test nested arrays',
        {
          type: 'object',
          properties: {
            filter: {
              type: 'object',
              properties: {
                type_ids: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'List of type IDs',
                },
                status: { type: 'string' },
              },
            },
          },
        },
        {
          kind: 'http',
          method: 'GET',
          url: 'https://example.com/test',
          bodyType: 'json',
          params: [],
        },
        { authorization: 'Bearer test_api_key' }
      );

      const parameters = tool.toOpenAI().function.parameters;
      expect(parameters).toBeDefined();
      const aiSchema = jsonSchema(parameters as JSONSchema7);
      expect(aiSchema).toBeDefined();

      const aiSdkTool = await tool.toAISDK();
      // TODO: Remove ts-ignore once AISDKToolDefinition properly types inputSchema.jsonSchema
      // @ts-ignore - jsonSchema is available on Schema wrapper from ai sdk
      const filterProp = aiSdkTool[tool.name].inputSchema.jsonSchema.properties?.filter as
        | (JSONSchema7 & { properties: Record<string, JSONSchema7> })
        | undefined;

      expect(filterProp?.type).toBe('object');
      expect(filterProp?.properties.type_ids.type).toBe('array');
      expect(filterProp?.properties.type_ids.items).toBeDefined();
    });
  });
});
