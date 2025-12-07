import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { compile } from 'svelte/compiler';

const config = {
  preprocess: vitePreprocess(),
  compilerOptions: {
    customElement: true
  }

  
};

export default config;
