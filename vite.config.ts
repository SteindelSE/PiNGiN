import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'src/main/index.ts',
        vite: {
          resolve: {
            alias: {
              '@shared': path.resolve(__dirname, './src/shared'),
            },
          },
          build: {
            outDir: 'dist/main',
            rollupOptions: {
              external: ['electron'],
              plugins: [],
            },
          },
        },
      },
      {
        entry: 'src/preload/index.ts',
        vite: {
          resolve: {
            alias: {
              '@shared': path.resolve(__dirname, './src/shared'),
            },
          },
          build: {
            outDir: 'dist/preload',
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@main': path.resolve(__dirname, './src/main'),
      '@renderer': path.resolve(__dirname, './src/renderer'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
