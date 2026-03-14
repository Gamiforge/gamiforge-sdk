import { defineConfig } from 'tsup';

export default defineConfig([
  // Core client (framework-agnostic)
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    outDir: 'dist',
    external: ['react', 'react-dom'],
    treeshake: true,
    splitting: false,
  },
  // React integration
  {
    entry: { 'react/index': 'src/react/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    outDir: 'dist',
    external: ['react', 'react-dom'],
    treeshake: true,
    splitting: false,
    esbuildOptions(options) {
      options.jsx = 'automatic';
    },
  },
]);
