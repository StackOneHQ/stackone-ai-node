/**
 * Common type definitions for the StackOne SDK
 */

import type { JSONSchema7, JSONSchema7Definition } from 'json-schema';

/**
 * Generic dictionary type for JSON-compatible objects
 */
export type JsonDict = Record<string, unknown>;

/**
 * HTTP headers type
 */
export type Headers = Record<string, string>;

/**
 * JSON Schema properties type
 */
export type JsonSchemaProperties = Record<string, JSONSchema7Definition>;

/**
 * JSON Schema type
 */
export type JsonSchemaType = JSONSchema7['type'];

/**
 * Type definition for a derivation function
 * Takes a source value and returns a derived value
 */
export type TransformFunction = (sourceValue: unknown) => unknown;

/**
 * Type definition for a map of derivation functions
 * Keys are transformed parameter names, values are functions to derive that parameter
 */
export type TransformFunctions = Record<string, TransformFunction>;

/**
 * Configuration for parameter transformations
 * The key in the derivation configs map is the source parameter name
 */
export type ParameterTransformer = {
  transforms: TransformFunctions;
};

/**
 * Type definition for a map of derivation configurations
 * Keys are source parameter names, values are derivation functions
 */
export type ParameterTransformerMap = Map<string, ParameterTransformer>;
