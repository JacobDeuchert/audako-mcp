<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { Message, ChatWidgetConfig } from './types';
  import './styles.css';

  const DEFAULT_CONFIG: ChatWidgetConfig = {
    title: 'Audako Assistant',
    placeholder: 'Type a message',
    initialMessage: 'Welcome to Audako MCP Chat. How can I assist you today?',
    adapter: undefined as any
  };

  let {
    config,
    header,
    primary = '#0B57D0',
    secondary = '#4D5F7A',
    darkMode = false
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

  let messages = $state<Message[]>([]);
  let draft = $state('');
  let isTyping = $state(false);
  let messagesContainer = $state<HTMLDivElement | undefined>();
  let streamingMessageId = $state<string | null>(null);

  const debug = (...args: unknown[]) => {
    console.log('[chat-ui]', ...args);
  };

  // Initialize component
  $effect(() => {
    debug('config resolved', {
      title: resolvedConfig?.title,
      hasAdapter: !!resolvedConfig?.adapter,
      adapterType: resolvedConfig?.adapter?.constructor?.name,
      hasInitialMessage: !!resolvedConfig?.initialMessage
    });

    // Initialize adapter if it has an init method
    if (resolvedConfig?.adapter && typeof resolvedConfig.adapter.init === 'function') {
      debug('initializing adapter');
      resolvedConfig.adapter.init().catch((error) => {
        console.error('Failed to initialize adapter:', error);
      });
    }

    // Set initial message
    if (resolvedConfig?.initialMessage && messages.length === 0) {
      messages = [{
        id: '1',
        from: 'system',
        text: resolvedConfig.initialMessage,
        timestamp: new Date()
      }];
    } else if (messages.length === 0) {
      messages = [{
        id: '1',
        from: 'system',
        text: 'Welcome to Audako MCP Chat. How can I assist you today?',
        timestamp: new Date()
      }];
    }
  });

  const scrollToBottom = () => {
    if (messagesContainer) {
      setTimeout(() => {
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }, 50);
    }
  };

  const sendMessage = async () => {
    debug('sendMessage called', {
      draftLength: draft.length,
      isDraftEmpty: !draft.trim(),
      hasStreamingMessage: !!streamingMessageId,
      hasAdapter: !!resolvedConfig?.adapter
    });

    if (!draft.trim() || streamingMessageId || !resolvedConfig?.adapter) {
      debug('sendMessage aborted', {
        reason: {
          emptyDraft: !draft.trim(),
          streamingInProgress: !!streamingMessageId,
          missingAdapter: !resolvedConfig?.adapter
        }
      });
      return;
    }
    
    const userMessage: Message = {
      id: Date.now().toString(),
      from: 'user',
      text: draft.trim(),
      timestamp: new Date()
    };
    
    messages = [...messages, userMessage];
    debug('user message appended', {
      messageId: userMessage.id,
      totalMessages: messages.length
    });

    const userText = draft.trim();
    draft = '';
    scrollToBottom();
    
    // Show typing indicator briefly
    isTyping = true;
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const messageId = (Date.now() + 1).toString();
    
    // Create streaming message
    const streamingMessage: Message = {
      id: messageId,
      from: 'assistant',
      text: '',
      timestamp: new Date(),
      isStreaming: true
    };
    
    messages = [...messages, streamingMessage];
    isTyping = false;
    streamingMessageId = messageId;
    debug('assistant streaming message created', {
      messageId,
      historyLength: messages.filter((m) => m.from !== 'system').length,
      adapterType: resolvedConfig.adapter.constructor?.name
    });
    scrollToBottom();

    // Use the adapter to send the message
    try {
      debug('calling adapter.sendMessage');
      await resolvedConfig.adapter.sendMessage(
        {
          message: userText,
          conversationHistory: messages.filter(m => m.from !== 'system')
        },
        {
          // onChunk callback
          onChunk: (chunk: string) => {
            debug('adapter chunk received', {
              messageId,
              chunkLength: chunk.length
            });

            const messageIndex = messages.findIndex(m => m.id === messageId);
            if (messageIndex !== -1) {
              messages[messageIndex] = {
                ...messages[messageIndex],
                text: chunk
              };
              messages = [...messages];
            }
            scrollToBottom();
          },
          // onThinking callback
          onThinking: (chunk: string) => {
            debug('adapter thinking chunk received', {
              messageId,
              chunkLength: chunk.length
            });

            const messageIndex = messages.findIndex(m => m.id === messageId);
            if (messageIndex !== -1) {
              messages[messageIndex] = {
                ...messages[messageIndex],
                thinking: {
                  content: chunk,
                  isStreaming: true
                }
              };
              messages = [...messages];
            }
            scrollToBottom();
          },
          // onComplete callback
          onComplete: () => {
            debug('adapter stream completed', { messageId });

            const messageIndex = messages.findIndex(m => m.id === messageId);
            if (messageIndex !== -1) {
              messages[messageIndex] = {
                ...messages[messageIndex],
                isStreaming: false,
                thinking: messages[messageIndex].thinking ? {
                  ...messages[messageIndex].thinking!,
                  isStreaming: false
                } : undefined
              };
              messages = [...messages];
            }
            streamingMessageId = null;
            scrollToBottom();
          },
          // onError callback
          onError: (error: Error) => {
            debug('adapter stream errored', {
              messageId,
              errorMessage: error.message
            });

            console.error('Chat error:', error);
            const messageIndex = messages.findIndex(m => m.id === messageId);
            if (messageIndex !== -1) {
              messages[messageIndex] = {
                ...messages[messageIndex],
                text: `Error: ${error.message}`,
                isStreaming: false
              };
              messages = [...messages];
            }
            streamingMessageId = null;
            scrollToBottom();
          }
        }
      );
      debug('adapter.sendMessage resolved', { messageId });
    } catch (error) {
      debug('adapter.sendMessage threw', {
        messageId,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });

      console.error('Unexpected error:', error);
      const messageIndex = messages.findIndex(m => m.id === messageId);
      if (messageIndex !== -1) {
        messages[messageIndex] = {
          ...messages[messageIndex],
          text: `Unexpected error occurred`,
          isStreaming: false
        };
        messages = [...messages];
      }
      streamingMessageId = null;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };
</script>

<div
  class="chat-widget"
  class:chat-widget--dark={darkMode}
  style={themeStyle}
>
  <header class="chat-widget__header">
    <div class="chat-widget__header-content">
      {#if header}
        {@render header(headerTitle)}
      {:else}
        <h2 class="chat-widget__header-title">{headerTitle}</h2>
      {/if}
    </div>
  </header>

  <div
    bind:this={messagesContainer}
    class="chat-widget__messages"
  >
    {#each messages as message (message.id)}
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
          {#if message.thinking && message.from === 'assistant'}
            <details class="chat-widget__thinking" open={message.thinking.isStreaming}>
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
                    {#if message.thinking.isStreaming}
                      <span class="chat-widget__thinking-pulse"></span>
                    {/if}
                  </span>
                </div>
              </summary>
              <div class="chat-widget__thinking-content">
                <p class="chat-widget__thinking-text">
                  {message.thinking.content}
                  {#if message.thinking.isStreaming}
                    <span class="chat-widget__stream-caret chat-widget__stream-caret--secondary"></span>
                  {/if}
                </p>
              </div>
            </details>
          {/if}

          <div
            class="chat-widget__bubble"
            class:chat-widget__bubble--user={message.from === 'user'}
            class:chat-widget__bubble--assistant={message.from === 'assistant'}
            class:chat-widget__bubble--system={message.from === 'system'}
          >
            <p class="chat-widget__bubble-content">
              {message.text}
              {#if message.isStreaming && !message.thinking?.isStreaming}
                <span class="chat-widget__stream-caret"></span>
              {/if}
            </p>
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
    {/each}

    {#if isTyping}
      <div class="chat-widget__typing-row">
        <div class="chat-widget__typing-bubble">
          <div class="chat-widget__typing-dots">
            <div class="chat-widget__typing-dot" style="animation-delay: 0ms"></div>
            <div class="chat-widget__typing-dot" style="animation-delay: 150ms"></div>
            <div class="chat-widget__typing-dot" style="animation-delay: 300ms"></div>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <footer class="chat-widget__footer">
    <form onsubmit={(e) => { e.preventDefault(); sendMessage(); }} class="chat-widget__composer">
      <div class="chat-widget__input-wrap">
        <input
          class="chat-widget__input"
          placeholder={resolvedConfig?.placeholder || 'Type a message'}
          bind:value={draft}
          disabled={isTyping || !!streamingMessageId}
        />
      </div>
      <button
        type="submit"
        class="chat-widget__send"
        disabled={!draft.trim() || isTyping || !!streamingMessageId}
        title="Send message"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="chat-widget__send-icon" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
        </svg>
      </button>
    </form>
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
    border-radius: 24px;
    box-shadow: var(--md-shadow-2);
    color: var(--md-on-surface);
    display: flex;
    flex-direction: column;
    font-family: 'Roboto', 'Noto Sans', 'Segoe UI', sans-serif;
    height: 600px;
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

  .chat-widget__message-row {
    display: flex;
  }

  .chat-widget__message-row--user {
    justify-content: flex-end;
  }

  .chat-widget__message-row--assistant,
  .chat-widget__message-row--system,
  .chat-widget__typing-row {
    justify-content: flex-start;
  }

  .chat-widget__message {
    display: flex;
    flex-direction: column;
    max-width: 84%;
  }

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

  .chat-widget__thinking-text,
  .chat-widget__bubble-content {
    line-height: 1.45;
    margin: 0;
    overflow-wrap: break-word;
    white-space: pre-wrap;
  }

  .chat-widget__thinking-text {
    color: var(--md-on-surface-variant);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
    font-size: 0.79rem;
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

  .chat-widget__timestamp {
    color: var(--md-on-surface-variant);
    font-size: 0.68rem;
    margin-top: 5px;
    padding: 0 8px;
  }

  .chat-widget__timestamp--user {
    text-align: right;
  }

  .chat-widget__typing-row {
    display: flex;
  }

  .chat-widget__typing-bubble {
    background: var(--md-surface-bright);
    border: 1px solid color-mix(in srgb, var(--md-outline) 34%, transparent);
    border-bottom-right-radius: 6px;
    border-radius: 18px;
    box-shadow: var(--md-shadow-1);
    padding: 12px 16px;
  }

  .chat-widget__typing-dots {
    display: flex;
    gap: 5px;
  }

  .chat-widget__typing-dot {
    animation: chat-widget-bounce 0.95s ease-in-out infinite;
    background: color-mix(in srgb, var(--md-outline) 55%, transparent);
    border-radius: 999px;
    height: 7px;
    width: 7px;
  }

  .chat-widget__footer {
    background: var(--md-surface);
    border-top: 1px solid color-mix(in srgb, var(--md-outline) 25%, transparent);
    padding: 12px 16px 16px;
  }

  .chat-widget__composer {
    align-items: center;
    background: var(--md-surface-bright);
    border: 1px solid color-mix(in srgb, var(--md-outline) 45%, transparent);
    border-radius: 999px;
    box-shadow: inset 0 1px 0 color-mix(in srgb, var(--md-outline) 12%, transparent);
    display: flex;
    gap: 8px;
    padding: 4px 6px 4px 12px;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .chat-widget__input-wrap {
    flex: 1;
  }

  .chat-widget__input {
    background: transparent;
    border: 0;
    color: var(--md-on-surface);
    font-size: 0.88rem;
    padding: 8px 6px;
    width: 100%;
  }

  .chat-widget__input::placeholder {
    color: color-mix(in srgb, var(--md-on-surface-variant) 72%, transparent);
  }

  .chat-widget__input:focus {
    outline: none;
  }

  .chat-widget__composer:focus-within {
    border-color: color-mix(in srgb, var(--md-outline) 70%, transparent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--md-outline) 20%, transparent);
  }

  .chat-widget__input:disabled {
    cursor: not-allowed;
    opacity: 0.64;
  }

  .chat-widget__send {
    align-items: center;
    background: color-mix(in srgb, var(--md-surface) 92%, white);
    border: 1px solid color-mix(in srgb, var(--md-outline) 55%, transparent);
    border-radius: 999px;
    box-shadow: none;
    color: var(--md-primary);
    cursor: pointer;
    display: inline-flex;
    height: 36px;
    justify-content: center;
    transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease, opacity 0.2s ease;
    width: 36px;
  }

  .chat-widget__send:hover:enabled {
    background: color-mix(in srgb, var(--md-surface) 86%, white);
    border-color: color-mix(in srgb, var(--md-outline) 75%, transparent);
  }

  .chat-widget__send:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }

  .chat-widget__send-icon {
    height: 18px;
    width: 18px;
  }

  @media (max-width: 640px) {
    .chat-widget {
      border-radius: 20px;
      height: min(72vh, 560px);
    }

    .chat-widget__messages {
      padding: 14px;
    }

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

  @keyframes chat-widget-bounce {
    0%,
    80%,
    100% {
      transform: translateY(0);
    }

    40% {
      transform: translateY(-2px);
    }
  }
</style>
