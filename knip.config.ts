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
			ignoreDependencies: ['msw'],
		},
	},
	ignore: ['**/*.test.ts', '**/*.spec.ts', '**/*.test-d.ts'],
	ignoreBinaries: ['only-allow', 'oxfmt', 'oxlint', 'tsx'],
	// Vitest spawns the native checker through an explicit file path.
	ignoreDependencies: ['@typescript/native-preview', '@typescript/native'],
	rules: {
		optionalPeerDependencies: 'off',
		devDependencies: 'warn',
	},
} satisfies KnipConfig;
