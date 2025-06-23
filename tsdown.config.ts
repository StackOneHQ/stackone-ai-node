import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: [ "./src/index.ts" ],
	outDir: 'dist',
	format: 'esm',
	clean: true,
	sourcemap: true,
	treeshake: true,
	dts: {
    resolve: [/^@types\//]
  },
	publint: true,
	unused: true,
	unbundle: true,
 });
