import { mount } from 'svelte';
import './app.postcss';
import App from './App.svelte';

const target = document.getElementById('app');

if (target) {
  mount(App, {target});
}
