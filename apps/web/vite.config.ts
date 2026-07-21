import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, 'src') },
      { find: '@sentinel/shared-types', replacement: path.resolve(__dirname, '../../packages/shared-types/src/index.ts') },
      { find: /^(\.\.?\/)+services(\/.*)?$/, replacement: path.resolve(__dirname, '../api/src/services$2') },
      { find: /^(\.\.\/)+lib(\/.*)?$/, replacement: path.resolve(__dirname, '../api/src/lib$2') },
    ],
  },
  server: {
    port: 5000,
    host: '0.0.0.0',
    allowedHosts: true,
    watch: {
      ignored: [
        '**/.pythonlibs/**',
        '**/node_modules/**',
        '**/models/**',
        '**/.git/**',
      ],
    },
  },
});
