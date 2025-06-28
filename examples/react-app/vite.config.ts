import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@growcado/react': resolve(__dirname, '../../dist/packages/react'),
      '@growcado/sdk': resolve(__dirname, '../../dist/packages/sdk')
    }
  },
  server: {
    port: 3020,
    open: true
  }
}); 