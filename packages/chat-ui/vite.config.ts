import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        customElement: false,
      },
      emitCss: true,
    }),
    dts({
      include: ['src/lib/**/*'],
      exclude: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
      outDir: 'dist',
      copyDtsFiles: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/lib/index.ts'),
      name: 'AudakoChatUI',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: id => /^svelte($|\/)/.test(id) || id === '@opencode-ai/sdk/client',
      output: {
        globals: {
          svelte: 'Svelte',
        },
        assetFileNames: assetInfo => {
          if (assetInfo.name === 'style.css') return 'style.css';
          return assetInfo.name || 'asset';
        },
      },
    },
  },
});
