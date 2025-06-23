import { $ } from 'bun';
import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['./src/index.ts'],
  outDir: 'dist',
  format: 'esm',
  clean: true,
  sourcemap: true,
  treeshake: true,
  dts: {
    tsgo: true,
    resolve: [/^@types\//],
  },
  publint: true,
  unused: true,
  unbundle: true,
  exports: true,
  hooks: {
    'build:done': async () => {
      // sourcemap files for generated code are not needed
      await $`rm -rf ./dist/openapi/generated/*.map`;
    },
  },
});
