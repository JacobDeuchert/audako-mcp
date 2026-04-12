import { resolve } from 'node:path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const externalPackages = [/^svelte($|\/)/, /^@mariozechner\/pi-web-ui($|\/)/];

export default defineConfig({
  server: {
    host: '0.0.0.0',
  },
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
      external: id => externalPackages.some(pattern => pattern.test(id)),
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
