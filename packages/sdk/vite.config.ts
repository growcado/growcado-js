import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/packages/sdk',
  plugins: [],
  
  // Build configuration for library
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'GrowcadoSDK',
      fileName: (format: string) => `index.${format === 'es' ? 'esm.js' : 'cjs'}`,
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      external: [],
      output: {}
    },
    outDir: 'dist',
    sourcemap: true,
  },
  
  test: {
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
  },
});
