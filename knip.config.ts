import type { KnipConfig } from 'knip';

export default {
	workspaces: {
		'.': {
			entry: ['src/index.ts', 'mocks/**/*.ts'],
			project: ['src/**/*.ts', 'mocks/**/*.ts'],
		},
		examples: {
			entry: ['*.ts', '*.test.ts'],
			project: ['*.ts'],
		},
	},
	ignore: ['**/*.test.ts', '**/*.spec.ts', '**/*.test-d.ts'],
	ignoreBinaries: ['only-allow', 'oxfmt', 'oxlint'],
	ignoreDependencies: ['@typescript/native-preview'],
	rules: {
		optionalPeerDependencies: 'off',
		devDependencies: 'warn',
	},
} satisfies KnipConfig;
