import { describe, expect, it } from 'bun:test';
import type { ParameterTransformer } from '../../types';
import { StackOneError } from '../../utils/errors';
import { ParameterMapper, transformParameter } from '../parameterMapper';

describe('ParameterMapper', () => {
  it('should initialize with no transformers', () => {
    const mapper = new ParameterMapper();
    expect(mapper).toBeDefined();
  });

  it('should initialize with provided transformers', () => {
    const transformers = new Map<string, ParameterTransformer>();
    transformers.set('sourceParam', {
      transforms: {
        targetParam: (value) => `transformed-${value}`,
      },
    });

    const mapper = new ParameterMapper(transformers);
    expect(mapper).toBeDefined();
    expect(mapper.getTransformer('sourceParam')).toBeDefined();
  });

  it('should add a transformer', () => {
    const mapper = new ParameterMapper();

    const transformer: ParameterTransformer = {
      transforms: {
        targetParam: (value) => `transformed-${value}`,
      },
    };

    mapper.addTransformer('sourceParam', transformer);

    const retrievedTransformer = mapper.getTransformer('sourceParam');
    expect(retrievedTransformer).toBe(transformer);
  });

  it('should map parameters without transformations', () => {
    const mapper = new ParameterMapper();
    const params = { param1: 'value1', param2: 'value2' };

    const result = mapper.mapParameters(params);

    expect(result).toEqual(params);
  });

  it('should map parameters with transformations', () => {
    const transformers = new Map<string, ParameterTransformer>();
    transformers.set('sourceParam', {
      transforms: {
        targetParam: (value) => `transformed-${value}`,
      },
    });

    const mapper = new ParameterMapper(transformers);
    const params = { sourceParam: 'value', otherParam: 'not-transformed' };

    const result = mapper.mapParameters(params);

    expect(result).toEqual({
      otherParam: 'not-transformed',
      targetParam: 'transformed-value',
    });
  });

  it('should handle parameters provided as a JSON string', () => {
    const mapper = new ParameterMapper();
    const paramsString = JSON.stringify({ param1: 'value1', param2: 'value2' });

    const result = mapper.mapParameters(paramsString);

    expect(result).toEqual({ param1: 'value1', param2: 'value2' });
  });

  it('should handle undefined parameters', () => {
    const mapper = new ParameterMapper();
    const result = mapper.mapParameters(undefined);

    expect(result).toEqual({});
  });

  it('should skip transformation if source parameter is not present', () => {
    const transformers = new Map<string, ParameterTransformer>();
    transformers.set('sourceParam', {
      transforms: {
        targetParam: (value) => `transformed-${value}`,
      },
    });

    const mapper = new ParameterMapper(transformers);
    const params = { otherParam: 'value' };

    const result = mapper.mapParameters(params);

    expect(result).toEqual({ otherParam: 'value' });
    expect(result).not.toHaveProperty('targetParam');
  });

  it('should handle multiple target parameters from a single source', () => {
    const transformers = new Map<string, ParameterTransformer>();
    transformers.set('sourceParam', {
      transforms: {
        targetParam1: (value) => `${value}-1`,
        targetParam2: (value) => `${value}-2`,
      },
    });

    const mapper = new ParameterMapper(transformers);
    const params = { sourceParam: 'value' };

    const result = mapper.mapParameters(params);

    expect(result).toEqual({
      targetParam1: 'value-1',
      targetParam2: 'value-2',
    });
  });

  it('should handle multiple source parameters with transformations', () => {
    const transformers = new Map<string, ParameterTransformer>();

    transformers.set('sourceParam1', {
      transforms: {
        targetParam1: (value) => `${value}-1`,
      },
    });

    transformers.set('sourceParam2', {
      transforms: {
        targetParam2: (value) => `${value}-2`,
      },
    });

    const mapper = new ParameterMapper(transformers);
    const params = { sourceParam1: 'value1', sourceParam2: 'value2' };

    const result = mapper.mapParameters(params);

    expect(result).toEqual({
      targetParam1: 'value1-1',
      targetParam2: 'value2-2',
    });
  });
});

describe('transformParameter', () => {
  it('should transform a parameter correctly', () => {
    const sourceValue = 'test';
    const targetParam = 'target';
    const sourceParam = 'source';
    const transformer: ParameterTransformer = {
      transforms: {
        target: (value) => `transformed-${value}`,
      },
    };

    const result = transformParameter(sourceValue, targetParam, sourceParam, transformer);

    expect(result).toEqual({ target: 'transformed-test' });
  });

  it('should return empty object if transformer for target param does not exist', () => {
    const sourceValue = 'test';
    const targetParam = 'nonExistentTarget';
    const sourceParam = 'source';
    const transformer: ParameterTransformer = {
      transforms: {
        target: (value) => `transformed-${value}`,
      },
    };

    const result = transformParameter(sourceValue, targetParam, sourceParam, transformer);

    expect(result).toEqual({});
  });

  it('should handle null return from transformation function', () => {
    const sourceValue = 'test';
    const targetParam = 'target';
    const sourceParam = 'source';
    const transformer: ParameterTransformer = {
      transforms: {
        target: () => null,
      },
    };

    const result = transformParameter(sourceValue, targetParam, sourceParam, transformer);

    expect(result).toEqual({});
  });

  it('should throw StackOneError when transformation function throws', () => {
    const sourceValue = 'test';
    const targetParam = 'target';
    const sourceParam = 'source';
    const transformer: ParameterTransformer = {
      transforms: {
        target: () => {
          throw new Error('Transformation error');
        },
      },
    };

    expect(() => {
      transformParameter(sourceValue, targetParam, sourceParam, transformer);
    }).toThrow(StackOneError);
  });
});
