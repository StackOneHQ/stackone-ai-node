/**
 * Parameter derivation functions for StackOne tools
 *
 * This file contains functions to transform parameter values from other parameters,
 * particularly for file uploads where we want to extract multiple values from a file path.
 */

import type { JsonDict, ParameterTransformer, ParameterTransformerMap } from '../types';
import { StackOneError } from '../utils/errors';

/**
 * Handles parameter mapping and transformation
 */
export class ParameterMapper {
  private transformers: ParameterTransformerMap;

  constructor(transformers?: ParameterTransformerMap) {
    this.transformers = transformers || new Map<string, ParameterTransformer>();
  }

  /**
   * Add a transformer for a parameter
   */
  addTransformer(sourceParam: string, transformer: ParameterTransformer): void {
    this.transformers.set(sourceParam, transformer);
  }

  /**
   * Get a transformer for a parameter
   */
  getTransformer(sourceParam: string): ParameterTransformer | undefined {
    return this.transformers.get(sourceParam);
  }

  /**
   * Map parameters from user input to API parameters
   */
  mapParameters(userParams: JsonDict | string | undefined): JsonDict {
    // If no parameters provided, return empty object
    if (!userParams) return {};

    // If parameters are provided as a string, parse them as JSON
    const params = typeof userParams === 'string' ? JSON.parse(userParams) : userParams;

    // Create a copy of the parameters to avoid modifying the original
    const mappedParams: JsonDict = { ...params };

    // Process transformed parameters
    for (const [sourceParam, config] of this.transformers.entries()) {
      // Skip if source parameter is not present
      if (!(sourceParam in params)) continue;

      // Get the source parameter value
      const sourceValue = params[sourceParam];

      // Process each derivation function
      for (const targetParam of Object.keys(config.transforms)) {
        try {
          // Derive the parameter value
          const derivedValues = transformParameter(sourceValue, targetParam, sourceParam, config);

          // Add derived values to mapped parameters
          Object.assign(mappedParams, derivedValues);
        } catch (error) {
          // Log error but continue processing other parameters
          console.error(`Error deriving parameter ${targetParam}:`, error);
        }
      }

      // Always remove source parameters after transformation
      delete mappedParams[sourceParam];
    }

    return mappedParams;
  }
}

/**
 * Apply derivation functions to derive a parameter from a source parameter
 *
 * @param sourceValue Value of the source parameter
 * @param targetParam Name of the parameter to derive
 * @param sourceParam Name of the source parameter
 * @param transformer The derivation configuration containing derivation functions
 * @returns Object with the transformed parameter value
 */
export const transformParameter = (
  sourceValue: unknown,
  targetParam: string,
  sourceParam: string,
  transformer: ParameterTransformer
): JsonDict => {
  const result: JsonDict = {};

  // Get the derivation function for the target parameter
  const deriveFn = transformer.transforms[targetParam];
  if (!deriveFn) return result;

  try {
    const derivedValue = deriveFn(sourceValue);
    if (derivedValue !== null) {
      result[targetParam] = derivedValue;
    }
  } catch (error) {
    throw new StackOneError(
      `Error deriving parameter ${targetParam} from ${sourceParam}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  return result;
};
