<script lang="ts">
import type { Message } from '../../types';
import MessageItem from './MessageItem.svelte';
import TypingIndicator from './TypingIndicator.svelte';

let {
  messages,
  showThinking,
  isTyping,
}: {
  messages: Message[];
  showThinking: boolean;
  isTyping: boolean;
} = $props();
</script>

{#each messages as message (message.id)}
  <MessageItem {message} {showThinking} />
{/each}

{#if isTyping}
  <TypingIndicator />
{/if}
