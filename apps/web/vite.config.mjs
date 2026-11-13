import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(appDir, '../..');

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    fs: { allow: [repositoryRoot] },
    watch: { usePolling: true, interval: 300 },
  },
  preview: { host: '127.0.0.1' },
});
