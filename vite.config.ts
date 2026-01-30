import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@floating-ui/dom': path.resolve(__dirname, 'node_modules/@floating-ui/dom'),
    },
  },
  define: {
    'process.env': {},
  },
});
