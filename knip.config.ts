import type { KnipConfig } from 'knip';

export default {
	workspaces: {
		'.': {
			entry: ['src/index.ts', 'mocks/**/*.ts'],
			project: ['src/**/*.ts', 'mocks/**/*.ts'],
		},
		examples: {
			entry: ['*.ts'],
			project: ['*.ts'],
			ignoreDependencies: ['@clack/prompts', '@tanstack/ai', '@tanstack/ai-openai', 'msw'],
		},
	},
	ignore: ['**/*.test.ts', '**/*.spec.ts', '**/*.test-d.ts'],
	// `test:node` is a script of StackOneHQ/sdk-conformance, run from its checkout in CI.
	ignoreBinaries: ['only-allow', 'oxfmt', 'oxlint', 'tsx', 'test:node'],
	// Vitest spawns the native checker through an explicit file path.
	ignoreDependencies: ['@typescript/native-preview', '@typescript/native'],
	rules: {
		optionalPeerDependencies: 'off',
		devDependencies: 'warn',
	},
} satisfies KnipConfig;
