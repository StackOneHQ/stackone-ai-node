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
    devExports: true,
  },
});
