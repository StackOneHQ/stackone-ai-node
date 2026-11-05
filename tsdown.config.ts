import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: ['./src/index.ts'],
	outDir: 'dist',
	format: ['esm', 'cjs'],
	clean: true,
	sourcemap: true,
	treeshake: true,
	dts: true,
	deps: {
		dts: {
			alwaysBundle: [/^@types\//, 'type-fest', 'ai'],
		},
	},
	publint: true,
	unused: true,
	unbundle: true,
	exports: {
		devExports: true,
	},
});
