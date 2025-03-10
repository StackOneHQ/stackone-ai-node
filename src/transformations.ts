/**
 * Parameter derivation functions for StackOne tools
 *
 * This file contains functions to transform parameter values from other parameters,
 * particularly for file uploads where we want to extract multiple values from a file path.
 */

import { StackOneError } from './tools';
import type { JsonDict, ParameterTransformer } from './types';

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
