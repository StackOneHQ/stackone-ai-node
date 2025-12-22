import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		watch: false,
		globals: true,
		testTimeout: 30000,
		setupFiles: ['./vitest.setup.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'json-summary', 'html'],
			include: ['src/**/*.ts'],
			exclude: ['**/*.test.ts', '**/*.test-d.ts', '**/index.ts', '**/type.ts'],
		},
		projects: [
			{
				extends: true,
				test: {
					name: 'root',
					root: '.',
					include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
					exclude: ['node_modules', 'dist', 'examples'],
					typecheck: {
						enabled: true,
						include: ['src/**/*.test.ts', 'src/**/*.test-d.ts'],
					},
				},
			},
			{
				extends: true,
				test: {
					name: 'examples',
					root: './examples',
					include: ['**/*.spec.ts', '**/*.test.ts'],
					exclude: ['node_modules', 'dist'],
				},
			},
		],
		deps: {
			interopDefault: true,
		},
	},
	resolve: {
		conditions: ['import', 'module', 'default'],
	},
});
