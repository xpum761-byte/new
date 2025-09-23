import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    return {
      plugins: [react()],
      resolve: {
        alias: {
          // Fix: In ES modules, __dirname is not available. Use import.meta.url instead.
          '@': fileURLToPath(new URL('.', import.meta.url)),
        }
      }
    };
});