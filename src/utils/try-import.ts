import { StackOneError } from './error-stackone';

/**
 * Dynamically import an optional dependency with a friendly error message
 *
 * @param moduleName - The name of the module to import
 * @param installHint - Installation instructions shown in error message
 * @returns The imported module
 * @throws StackOneError if the module is not installed
 *
 * @example
 * ```ts
 * const ai = await tryImport('ai', 'npm install ai@4.x|5.x');
 * const { jsonSchema } = ai;
 * ```
 */
export async function tryImport<T>(moduleName: string, installHint: string): Promise<T> {
	try {
		return await import(moduleName);
	} catch {
		throw new StackOneError(
			`${moduleName} is not installed. Please install it with: ${installHint}`,
		);
	}
}
