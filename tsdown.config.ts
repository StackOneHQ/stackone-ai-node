import { execSync } from 'node:child_process';
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
    devExports: !process.env.RELEASE,
  },
  hooks: {
    'build:done': async () => {
      // sourcemap files for generated code are not needed
      execSync('rm -rf ./dist/openapi/generated/*.map');
    },
  },
});
