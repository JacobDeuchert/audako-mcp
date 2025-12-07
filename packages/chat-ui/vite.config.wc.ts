import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        customElement: true
      }
    })
  ],
  build: {
    lib: {
      entry: './src/lib/register.ts',
      name: 'AudakoChat',
      fileName: () => 'audako-chat.js',
      formats: ['es']
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        assetFileNames: 'audako-chat.css'
      }
    },
    emptyOutDir: true,
    cssCodeSplit: false
  }
});
