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
	ignoreBinaries: ['only-allow'],
	ignoreDependencies: ['@typescript/native-preview', 'lefthook'],
	rules: {
		optionalPeerDependencies: 'off',
		devDependencies: 'warn',
	},
} satisfies KnipConfig;
