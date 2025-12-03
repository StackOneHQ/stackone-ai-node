import { $, env } from 'bun';
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
    resolve: [/^@types\//, 'type-fest'],
  },
  publint: true,
  unused: true,
  unbundle: true,
  exports: {
    devExports: !env.RELEASE,
  },
  hooks: {
    'build:done': async () => {
      // sourcemap files for generated code are not needed
      await $`rm -rf ./dist/openapi/generated/*.map`;
    },
  },
});
