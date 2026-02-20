<script lang="ts">
import type { Snippet } from 'svelte';
import type { ChatWidgetConfig } from './types';
import { useChatController } from './chat/useChatController.svelte';
import ChatHeader from './components/chat-widget/ChatHeader.svelte';
import MessageList from './components/chat-widget/MessageList.svelte';
import QuestionPanel from './components/chat-widget/QuestionPanel.svelte';
import Composer from './components/chat-widget/Composer.svelte';

const DEFAULT_CONFIG: ChatWidgetConfig = {
  title: 'Audako Assistant',
  placeholder: 'Type a message',
  initialMessage: 'Welcome to Audako MCP Chat. How can I assist you today?',
  showThinking: true,
  adapter: undefined as any,
};

let {
  config,
  header,
  primary = '#0B57D0',
  secondary = '#4D5F7A',
  darkMode = false,
}: {
  config?: ChatWidgetConfig;
  header?: Snippet<[string]>;
  primary?: string;
  secondary?: string;
  darkMode?: boolean;
} = $props();
const resolvedConfig = $derived(config ?? DEFAULT_CONFIG);
const headerTitle = $derived(resolvedConfig?.title || 'Audako Assistant');
const themeStyle = $derived(`--chat-primary: ${primary}; --chat-secondary: ${secondary};`);
const showThinking = $derived(resolvedConfig?.showThinking ?? true);
const composerPlaceholder = $derived(resolvedConfig?.placeholder || 'Type a message');

let messagesContainer = $state<HTMLDivElement | undefined>();

const scrollToBottom = () => {
  if (messagesContainer) {
    setTimeout(() => {
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, 50);
  }
};

const controller = useChatController({
  getConfig: () => resolvedConfig,
  getShowThinking: () => showThinking,
  scrollToBottom,
});

const composerDisabled = $derived(
  controller.state.isTyping || !!controller.state.streamingMessageId,
);

$effect(() => {
  controller.syncConfig();
});
</script>

<div
  class="chat-widget"
  class:chat-widget--dark={darkMode}
  style={themeStyle}
  onkeydown={(e) => e.stopPropagation()}
  onkeyup={(e) => e.stopPropagation()}
  onkeypress={(e) => e.stopPropagation()}
>
  <ChatHeader title={headerTitle} {header} />

  <div bind:this={messagesContainer} class="chat-widget__messages">
    <MessageList
      messages={controller.state.messages}
      {showThinking}
      isTyping={controller.state.isTyping}
    />
  </div>

  <footer class="chat-widget__footer">
    {#if controller.state.pendingQuestion}
      <QuestionPanel
        question={controller.state.pendingQuestion}
        selectedAnswers={controller.state.selectedQuestionAnswers}
        autoFocusFirst={controller.state.shouldFocusQuestion}
        onToggleAnswer={controller.toggleQuestionAnswer}
        onSubmitAnswers={controller.submitQuestionAnswers}
        onAutoFocusHandled={controller.clearQuestionFocusRequest}
      />
    {:else}
      <Composer
        draft={controller.state.draft}
        placeholder={composerPlaceholder}
        disabled={composerDisabled}
        onDraftChange={controller.setDraft}
        onSubmit={controller.sendMessage}
      />
    {/if}
  </footer>
</div>

<style>
  .chat-widget {
    --chat-primary: #0b57d0;
    --chat-secondary: #4d5f7a;
    --md-primary: var(--chat-primary);
    --md-secondary: var(--chat-secondary);
    --md-on-primary: #ffffff;
    --md-surface: #f7f8fc;
    --md-surface-container: #eef2f8;
    --md-surface-container-high: #e5eaf4;
    --md-surface-bright: #ffffff;
    --md-on-surface: #1a1c20;
    --md-on-surface-variant: #464a53;
    --md-outline: #747883;
    --md-outline-variant: #c4c8d2;
    --md-primary-container: color-mix(in srgb, var(--md-primary) 10%, white);
    --md-on-primary-container: color-mix(in srgb, var(--md-primary) 45%, black);
    --md-secondary-container: color-mix(in srgb, var(--md-secondary) 12%, white);
    --md-on-secondary-container: color-mix(in srgb, var(--md-secondary) 40%, black);
    --md-shadow-1: 0 1px 2px rgba(15, 23, 42, 0.1), 0 1px 3px rgba(15, 23, 42, 0.08);
    --md-shadow-2: 0 6px 14px rgba(15, 23, 42, 0.14), 0 2px 5px rgba(15, 23, 42, 0.08);
    align-items: stretch;
    background: var(--md-surface);
    border: 1px solid color-mix(in srgb, var(--md-outline) 25%, transparent);
    border-radius: 12px;
    box-shadow: var(--md-shadow-2);
    color: var(--md-on-surface);
    display: flex;
    flex-direction: column;
    font-family: 'Roboto', 'Noto Sans', 'Segoe UI', sans-serif;
    height: 100%;
    max-height: 80vh;
    min-height: 360px;
    overflow: hidden;
  }

  .chat-widget--dark {
    --md-surface: #12141c;
    --md-surface-container: #1b1e27;
    --md-surface-container-high: #242835;
    --md-surface-bright: #2b3040;
    --md-on-surface: #e4e2eb;
    --md-on-surface-variant: #c5c6d1;
    --md-outline: #9094a0;
    --md-outline-variant: #434754;
    --md-primary-container: color-mix(in srgb, var(--md-primary) 26%, black);
    --md-on-primary-container: color-mix(in srgb, var(--md-primary) 70%, white);
    --md-secondary-container: color-mix(in srgb, var(--md-secondary) 22%, black);
    --md-on-secondary-container: color-mix(in srgb, var(--md-secondary) 68%, white);
    --md-shadow-1: 0 1px 2px rgba(0, 0, 0, 0.34), 0 1px 3px rgba(0, 0, 0, 0.26);
    --md-shadow-2: 0 8px 18px rgba(0, 0, 0, 0.5), 0 2px 6px rgba(0, 0, 0, 0.36);
  }

  .chat-widget__messages {
    background: linear-gradient(180deg, color-mix(in srgb, var(--md-surface) 96%, white), var(--md-surface));
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
    padding: 18px;
    scroll-behavior: smooth;
  }

  .chat-widget__messages::-webkit-scrollbar {
    width: 10px;
  }

  .chat-widget__messages::-webkit-scrollbar-thumb {
    background: color-mix(in srgb, var(--md-outline) 45%, transparent);
    border: 2px solid transparent;
    border-radius: 999px;
    background-clip: content-box;
  }

  .chat-widget__footer {
    background: var(--md-surface);
    border-top: 1px solid color-mix(in srgb, var(--md-outline) 25%, transparent);
    padding: 12px 16px 16px;
  }

  @media (max-width: 640px) {
    .chat-widget {
      border-radius: 20px;
      max-height: 74vh;
      min-height: 320px;
    }

    .chat-widget__messages {
      padding: 14px;
    }
  }
</style>
