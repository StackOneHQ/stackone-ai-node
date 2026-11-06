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
		// tsdown 0.23 would list the dependencies whose types are bundled into dist in package.json.
		inlinedDependencies: false,
	},
});
