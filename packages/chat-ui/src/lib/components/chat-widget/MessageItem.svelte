<script lang="ts">
import type { Message } from '../../types';
import { formatTime } from '../../chat/utils/time';
import { renderMessageMarkdown } from '../../chat/utils/markdown';
import ThinkingBlock from './ThinkingBlock.svelte';

let {
  message,
  showThinking,
}: {
  message: Message;
  showThinking: boolean;
} = $props();
</script>

<div
  class="chat-widget__message-row"
  class:chat-widget__message-row--user={message.from === 'user'}
  class:chat-widget__message-row--assistant={message.from === 'assistant'}
  class:chat-widget__message-row--system={message.from === 'system'}
>
  <div
    class="chat-widget__message"
    class:chat-widget__message--user={message.from === 'user'}
    class:chat-widget__message--assistant={message.from === 'assistant'}
    class:chat-widget__message--system={message.from === 'system'}
  >
    {#if showThinking && message.thinking && message.from === 'assistant'}
      <ThinkingBlock thinking={message.thinking} />
    {/if}

    <div
      class="chat-widget__bubble"
      class:chat-widget__bubble--user={message.from === 'user'}
      class:chat-widget__bubble--assistant={message.from === 'assistant'}
      class:chat-widget__bubble--system={message.from === 'system'}
    >
      <div class="chat-widget__bubble-content">
        {@html renderMessageMarkdown(message.text)}
        {#if message.isStreaming && !(showThinking && message.thinking?.isStreaming)}
          <span class="chat-widget__stream-caret"></span>
        {/if}
      </div>
    </div>
    <span
      class="chat-widget__timestamp"
      class:chat-widget__timestamp--user={message.from === 'user'}
      class:chat-widget__timestamp--assistant={message.from === 'assistant'}
      class:chat-widget__timestamp--system={message.from === 'system'}
    >
      {formatTime(message.timestamp)}
    </span>
  </div>
</div>

<style>
  .chat-widget__message-row {
    display: flex;
  }

  .chat-widget__message-row--user {
    justify-content: flex-end;
  }

  .chat-widget__message-row--assistant,
  .chat-widget__message-row--system {
    justify-content: flex-start;
  }

  .chat-widget__message {
    display: flex;
    flex-direction: column;
    max-width: 84%;
  }

  .chat-widget__bubble {
    border: 1px solid transparent;
    border-radius: 18px;
    box-shadow: var(--md-shadow-1);
    padding: 10px 14px;
  }

  .chat-widget__bubble--user {
    background: var(--md-primary-container);
    border-bottom-left-radius: 6px;
    border-color: color-mix(in srgb, var(--md-primary) 28%, transparent);
    color: var(--md-on-primary-container);
  }

  .chat-widget__bubble--assistant {
    background: var(--md-surface-bright);
    border-bottom-right-radius: 6px;
    border-color: color-mix(in srgb, var(--md-outline) 38%, transparent);
    color: var(--md-on-surface);
  }

  .chat-widget__bubble--system {
    background: color-mix(in srgb, var(--md-primary-container) 70%, var(--md-surface-bright));
    border-color: color-mix(in srgb, var(--md-outline) 40%, transparent);
    color: var(--md-on-surface);
  }

  .chat-widget__bubble-content {
    font-size: 0.89rem;
    line-height: 1.45;
    margin: 0;
    overflow-wrap: break-word;
    white-space: normal;
  }

  .chat-widget__bubble-content :global(p),
  .chat-widget__bubble-content :global(ul),
  .chat-widget__bubble-content :global(ol) {
    margin: 0;
  }

  .chat-widget__bubble-content :global(p + p),
  .chat-widget__bubble-content :global(p + ul),
  .chat-widget__bubble-content :global(p + ol),
  .chat-widget__bubble-content :global(ul + p),
  .chat-widget__bubble-content :global(ol + p),
  .chat-widget__bubble-content :global(ul + ul),
  .chat-widget__bubble-content :global(ol + ol),
  .chat-widget__bubble-content :global(ul + ol),
  .chat-widget__bubble-content :global(ol + ul) {
    margin-top: 0.45em;
  }

  .chat-widget__bubble-content :global(ul),
  .chat-widget__bubble-content :global(ol) {
    padding-left: 1.2em;
  }

  .chat-widget__bubble-content :global(li + li) {
    margin-top: 0.22em;
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

  .chat-widget__timestamp {
    color: var(--md-on-surface-variant);
    font-size: 0.68rem;
    margin-top: 5px;
    padding: 0 8px;
  }

  .chat-widget__timestamp--user {
    text-align: right;
  }

  @media (max-width: 640px) {
    .chat-widget__message {
      max-width: 92%;
    }
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
