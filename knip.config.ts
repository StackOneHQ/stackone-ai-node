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
		},
	},
	ignore: ['**/*.test.ts', '**/*.spec.ts', '**/*.test-d.ts'],
	ignoreBinaries: ['only-allow', 'oxfmt', 'oxlint', 'tsx'],
	ignoreDependencies: [],
	rules: {
		optionalPeerDependencies: 'off',
		devDependencies: 'warn',
	},
} satisfies KnipConfig;
