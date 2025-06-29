import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@growcado/react': resolve(__dirname, '../../packages/react/src'),
      '@growcado/sdk': resolve(__dirname, '../../packages/sdk/src')
    }
  },
  server: {
    port: 3020,
    open: true
  },
  envDir: resolve(__dirname, '..'), // Load .env files from examples/ directory
}); 