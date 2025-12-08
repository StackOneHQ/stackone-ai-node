import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    watch: false,
    globals: true,
    include: ['src/**/*.spec.ts', 'scripts/**/*.spec.ts'],
    exclude: ['node_modules', 'dist', 'examples', 'src/toolsets/tests/stackone.mcp-fetch.spec.ts'],
    setupFiles: ['./vitest.setup.ts'],
    testTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/**/tests/**'],
    },
    deps: {
      interopDefault: true,
    },
    typecheck: {
      enabled: true,
      include: ['src/**/*.spec.ts', 'src/**/*.test-d.ts'],
    },
  },
  resolve: {
    conditions: ['import', 'module', 'default'],
  },
});
