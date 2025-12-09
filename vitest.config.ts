import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    watch: false,
    globals: true,
    testTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
      include: ['src/**/*.ts', 'examples/**/*.ts'],
      exclude: ['**/*.spec.ts', '**/*.test.ts', '**/*.test-d.ts', '**/tests/**'],
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'root',
          root: '.',
          include: ['src/**/*.spec.ts', 'scripts/**/*.spec.ts'],
          exclude: ['node_modules', 'dist', 'examples'],
          setupFiles: ['./vitest.setup.ts'],
          typecheck: {
            enabled: true,
            include: ['src/**/*.spec.ts', 'src/**/*.test-d.ts'],
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
