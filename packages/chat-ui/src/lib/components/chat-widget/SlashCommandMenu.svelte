<script lang="ts">
import type { SlashCommand } from '../../types';

let {
  commands,
  selectedIndex,
  onSelect,
}: {
  commands: SlashCommand[];
  selectedIndex: number;
  onSelect: (command: SlashCommand) => void;
} = $props();
</script>

<div class="chat-widget__slash-menu">
  {#each commands as command, index}
    <button
      type="button"
      class="chat-widget__slash-item"
      class:chat-widget__slash-item--selected={index === selectedIndex}
      onclick={() => onSelect(command)}
    >
      <span class="chat-widget__slash-name">/{command.name}</span>
      <span class="chat-widget__slash-desc">{command.description}</span>
    </button>
  {/each}
</div>

<style>
  .chat-widget__slash-menu {
    background: var(--md-surface-bright);
    border: 1px solid color-mix(in srgb, var(--md-outline) 25%, transparent);
    border-radius: 12px;
    box-shadow: var(--md-shadow-2);
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-height: 240px;
    overflow-y: auto;
    padding: 6px;
  }

  .chat-widget__slash-menu::-webkit-scrollbar {
    width: 8px;
  }

  .chat-widget__slash-menu::-webkit-scrollbar-thumb {
    background: color-mix(in srgb, var(--md-outline) 35%, transparent);
    background-clip: content-box;
    border: 2px solid transparent;
    border-radius: 999px;
  }

  .chat-widget__slash-item {
    align-items: center;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: var(--md-on-surface);
    cursor: pointer;
    display: flex;
    gap: 12px;
    padding: 10px 14px;
    text-align: left;
    transition: background 0.15s ease;
    width: 100%;
  }

  .chat-widget__slash-item:hover {
    background: color-mix(in srgb, var(--md-surface) 92%, white);
  }

  .chat-widget__slash-item--selected,
  .chat-widget__slash-item--selected:hover {
    background: var(--md-primary-container);
  }

  .chat-widget__slash-name {
    color: var(--md-on-surface);
    font-family: monospace;
    font-size: 0.85rem;
    font-weight: 600;
    white-space: nowrap;
  }

  .chat-widget__slash-item--selected .chat-widget__slash-name {
    color: var(--md-on-primary-container);
  }

  .chat-widget__slash-desc {
    color: var(--md-on-surface-variant);
    font-size: 0.8rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .chat-widget__slash-item--selected .chat-widget__slash-desc {
    color: var(--md-on-primary-container);
    opacity: 0.85;
  }
</style>
