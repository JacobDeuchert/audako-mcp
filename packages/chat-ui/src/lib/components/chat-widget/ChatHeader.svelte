<script lang="ts">
import type { Snippet } from 'svelte';

let {
  title,
  header,
}: {
  title: string;
  header?: Snippet<[string]>;
} = $props();
</script>

<header class="chat-widget__header">
  <div class="chat-widget__header-content">
    {#if header}
      {@render header(title)}
    {:else}
      <h2 class="chat-widget__header-title">{title}</h2>
    {/if}
  </div>
</header>

<style>
  .chat-widget__header {
    background: var(--md-surface-container);
    border-bottom: 1px solid color-mix(in srgb, var(--md-outline) 30%, transparent);
    padding: 14px 18px;
  }

  .chat-widget__header-title {
    color: var(--md-on-surface);
    font-size: 0.95rem;
    font-weight: 500;
    letter-spacing: 0.0125em;
    line-height: 1.3;
    margin: 0;
  }
</style>
