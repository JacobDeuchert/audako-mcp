<script lang="ts">
import type { ThinkingBlock as ThinkingData } from '../../types';

let {
  thinking,
}: {
  thinking: ThinkingData;
} = $props();
</script>

<details class="chat-widget__thinking" open={thinking.isStreaming}>
  <summary class="chat-widget__thinking-summary">
    <div class="chat-widget__thinking-toggle">
      <svg class="chat-widget__thinking-chevron" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
      <span class="chat-widget__thinking-label">
        <svg class="chat-widget__thinking-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        Thinking
        {#if thinking.isStreaming}
          <span class="chat-widget__thinking-pulse"></span>
        {/if}
      </span>
    </div>
  </summary>
  <div class="chat-widget__thinking-content">
    <p class="chat-widget__thinking-text">
      {thinking.content}
      {#if thinking.isStreaming}
        <span class="chat-widget__stream-caret chat-widget__stream-caret--secondary"></span>
      {/if}
    </p>
  </div>
</details>

<style>
  .chat-widget__thinking {
    margin-bottom: 8px;
  }

  .chat-widget__thinking-summary {
    cursor: pointer;
    list-style: none;
  }

  .chat-widget__thinking-summary::-webkit-details-marker {
    display: none;
  }

  .chat-widget__thinking-toggle {
    align-items: center;
    background: var(--md-surface-bright);
    border: 1px solid color-mix(in srgb, var(--md-outline) 45%, transparent);
    border-radius: 14px;
    color: var(--md-on-surface-variant);
    display: inline-flex;
    gap: 8px;
    padding: 8px 11px;
    transition: border-color 0.2s ease, background 0.2s ease;
  }

  .chat-widget__thinking-toggle:hover {
    background: color-mix(in srgb, var(--md-surface-bright) 92%, var(--md-outline) 8%);
    border-color: color-mix(in srgb, var(--md-outline) 65%, transparent);
  }

  .chat-widget__thinking-chevron {
    height: 14px;
    transition: transform 0.2s ease;
    width: 14px;
  }

  .chat-widget__thinking[open] .chat-widget__thinking-chevron {
    transform: rotate(90deg);
  }

  .chat-widget__thinking-label {
    align-items: center;
    display: inline-flex;
    font-size: 0.72rem;
    font-weight: 600;
    gap: 5px;
    letter-spacing: 0.01em;
  }

  .chat-widget__thinking-icon {
    height: 13px;
    width: 13px;
  }

  .chat-widget__thinking-pulse {
    animation: chat-widget-pulse 1.1s ease-in-out infinite;
    background: currentColor;
    border-radius: 999px;
    display: inline-block;
    height: 6px;
    width: 6px;
  }

  .chat-widget__thinking-content {
    background: color-mix(in srgb, var(--md-surface-bright) 88%, var(--md-surface));
    border: 1px solid color-mix(in srgb, var(--md-outline) 35%, transparent);
    border-radius: 14px;
    margin-top: 8px;
    padding: 11px 13px;
  }

  .chat-widget__thinking-text {
    color: var(--md-on-surface-variant);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
    font-size: 0.79rem;
    line-height: 1.45;
    margin: 0;
    overflow-wrap: break-word;
    white-space: pre-wrap;
  }

  .chat-widget__stream-caret {
    animation: chat-widget-pulse 1.1s ease-in-out infinite;
    background: currentColor;
    border-radius: 999px;
    display: inline-block;
    height: 13px;
    margin-left: 4px;
    opacity: 0.9;
    vertical-align: text-bottom;
    width: 2px;
  }

  .chat-widget__stream-caret--secondary {
    color: var(--md-on-secondary-container);
  }

  @keyframes chat-widget-pulse {
    0%,
    100% {
      opacity: 0.45;
    }

    50% {
      opacity: 1;
    }
  }
</style>
