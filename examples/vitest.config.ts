import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    watch: false,
    globals: true,
    include: ['**/*.spec.ts'],
    setupFiles: ['./vitest.setup.ts'],
    testTimeout: 30000,
    typecheck: {
      enabled: true,
      include: ['**/*.spec.ts'],
    },
  },
});
