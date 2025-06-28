import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@growcado/sdk': resolve(__dirname, '../../dist/packages/sdk')
    }
  },
  server: {
    port: 3000,
    open: true
  }
}); 