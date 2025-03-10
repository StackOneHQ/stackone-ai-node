/**
 * Safely removes a property from a JSON Schema object
 * This function uses type assertions to satisfy both TypeScript type checking
 * and linter preferences (using undefined assignment over delete operator)
 *
 * @param obj The object containing JSON Schema properties
 * @param key The key of the property to remove
 */
export const removeJsonSchemaProperty = <T>(obj: Record<string, T>, key: string): void => {
  if (obj && key in obj) {
    obj[key] = undefined as unknown as T;
  }
};

/**
 * Creates a new object without the specified property
 * This is an alternative to removeJsonSchemaProperty when you want to avoid
 * modifying the original object
 *
 * @param obj The object containing JSON Schema properties
 * @param key The key of the property to remove
 * @returns A new object without the specified property
 */
export const withoutJsonSchemaProperty = <T>(
  obj: Record<string, T>,
  key: string
): Record<string, T> => {
  if (!obj || !(key in obj)) {
    return obj;
  }

  // Create a shallow copy of the object
  const result: Record<string, T> = { ...obj };

  // Remove the property
  removeJsonSchemaProperty(result, key);

  return result;
};
