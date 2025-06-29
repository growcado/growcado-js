import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  envDir: '../',
  optimizeDeps: {
    include: ['axios']
  },
  resolve: {
    alias: {
      '@growcado/sdk': path.resolve(__dirname, '../../packages/sdk/src/index.ts')
    }
  },
  define: {
    global: 'globalThis'
  },
  server: {
    port: 3010,
    open: true
  }
}); 