import { StackOneError } from './error-stackone';
import { tryImport } from './try-import';

describe('tryImport', () => {
	it('should successfully import an existing module', async () => {
		const result = await tryImport<typeof import('node:path')>('node:path', 'n/a');
		expect(result).toHaveProperty('join');
		expect(typeof result.join).toBe('function');
	});

	it('should throw StackOneError for non-existent module', async () => {
		await expect(
			tryImport('non-existent-module-xyz', 'npm install non-existent-module-xyz'),
		).rejects.toThrow(StackOneError);
	});

	it('should include module name and install hint in error message', async () => {
		const installHint = 'npm install my-package or pnpm add my-package';
		await expect(tryImport('non-existent-module-xyz', installHint)).rejects.toThrow(
			'non-existent-module-xyz is not installed. Please install it with: npm install my-package or pnpm add my-package',
		);
	});
});
