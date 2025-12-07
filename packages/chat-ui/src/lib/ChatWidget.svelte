<svelte:options customElement={{ tag: "audako-chat", shadow: "none" }} />

<script lang="ts">
  import type { Message, ChatWidgetConfig } from './types';

  // Props - can be set via the config
  let config = $state<ChatWidgetConfig | undefined>(undefined);
  
  let messages = $state<Message[]>([]);
  let draft = $state('');
  let isTyping = $state(false);
  let messagesContainer = $state<HTMLDivElement | undefined>();
  let streamingMessageId = $state<string | null>(null);

  // Initialize component
  $effect(() => {
    if (!config) {
      // Try to get config from global window object (set by register function)
      const globalConfig = (window as any).__audakoChatConfig as ChatWidgetConfig | undefined;
      if (globalConfig) {
        config = globalConfig;
      }
    }
    
    // Set initial message
    if (config?.initialMessage && messages.length === 0) {
      messages = [{
        id: '1',
        from: 'system',
        text: config.initialMessage,
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
    if (!draft.trim() || streamingMessageId || !config?.adapter) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      from: 'user',
      text: draft.trim(),
      timestamp: new Date()
    };
    
    messages = [...messages, userMessage];
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
    scrollToBottom();

    // Use the adapter to send the message
    try {
      await config.adapter.sendMessage(
        {
          message: userText,
          conversationHistory: messages.filter(m => m.from !== 'system')
        },
        {
          // onChunk callback
          onChunk: (chunk: string) => {
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
    } catch (error) {
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

  // Expose public API
  export function setConfig(newConfig: ChatWidgetConfig) {
    config = newConfig;
  }

  export function clearMessages() {
    messages = [];
    if (config?.initialMessage) {
      messages = [{
        id: Date.now().toString(),
        from: 'system',
        text: config.initialMessage,
        timestamp: new Date()
      }];
    }
  }

  export function addMessage(text: string, from: 'user' | 'assistant' | 'system' = 'system') {
    const newMessage: Message = {
      id: Date.now().toString(),
      from,
      text,
      timestamp: new Date()
    };
    messages = [...messages, newMessage];
    scrollToBottom();
  }
</script>

<div class="flex flex-col bg-white h-[600px] rounded-lg shadow-lg overflow-hidden">
  <header class="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
    <div>
      <h2 class="text-base font-medium text-slate-900">{config?.title || 'Audako Assistant'}</h2>
    </div>
    <button class="p-2 hover:bg-slate-200 rounded-full transition-colors" title="Options">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
      </svg>
    </button>
  </header>

  <div 
    bind:this={messagesContainer}
    class="flex-1 overflow-y-auto px-6 py-4 space-y-3 scroll-smooth bg-slate-50"
  >
    {#each messages as message (message.id)}
      <div class="flex {message.from === 'user' ? 'justify-end' : 'justify-start'}">
        <div class="flex flex-col max-w-[80%]">
          <!-- Thinking section (only for assistant messages) -->
          {#if message.thinking && message.from === 'assistant'}
            <details class="mb-2 group" open={message.thinking.isStreaming}>
              <summary class="cursor-pointer list-none">
                <div class="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors">
                  <svg class="w-4 h-4 text-amber-600 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                  <span class="text-xs font-medium text-amber-900 flex items-center gap-1.5">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Thinking
                    {#if message.thinking.isStreaming}
                      <span class="inline-block w-1 h-1 bg-amber-600 rounded-full animate-pulse"></span>
                    {/if}
                  </span>
                </div>
              </summary>
              <div class="mt-2 px-4 py-3 bg-amber-50/50 border border-amber-100 rounded-lg">
                <p class="text-[13px] leading-relaxed whitespace-pre-wrap break-words text-amber-950 font-mono">
                  {message.thinking.content}
                  {#if message.thinking.isStreaming}
                    <span class="inline-block w-1.5 h-3.5 bg-amber-600 ml-0.5 animate-pulse"></span>
                  {/if}
                </p>
              </div>
            </details>
          {/if}

          <!-- Main message content -->
          <div
            class="px-4 py-2.5 {
              message.from === 'user'
                ? 'bg-blue-600 text-white rounded-t-2xl rounded-bl-2xl'
                : message.from === 'assistant'
                  ? 'bg-white text-slate-900 border border-slate-200 rounded-t-2xl rounded-br-2xl shadow-sm'
                  : 'bg-blue-50 text-blue-900 border border-blue-100 rounded-2xl'
            }"
          >
            <p class="text-[14px] leading-relaxed whitespace-pre-wrap break-words">
              {message.text}
              {#if message.isStreaming && !message.thinking?.isStreaming}
                <span class="inline-block w-1.5 h-4 bg-blue-600 ml-0.5 animate-pulse"></span>
              {/if}
            </p>
          </div>
          <span class="text-[11px] text-slate-500 mt-1.5 px-2 {message.from === 'user' ? 'text-right' : 'text-left'}">
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    {/each}

    {#if isTyping}
      <div class="flex justify-start">
        <div class="bg-white border border-slate-200 rounded-t-2xl rounded-br-2xl px-5 py-3 shadow-sm">
          <div class="flex gap-1">
            <div class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
            <div class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
            <div class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <footer class="border-t border-slate-200 px-5 py-4 bg-white">
    <form onsubmit={(e) => { e.preventDefault(); sendMessage(); }} class="flex gap-2 items-end">
      <div class="flex-1">
        <input
          class="w-full rounded-full border border-slate-300 px-5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all placeholder:text-slate-400"
          placeholder={config?.placeholder || 'Type a message'}
          bind:value={draft}
          disabled={isTyping || !!streamingMessageId}
        />
      </div>
      <button
        type="submit"
        class="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white p-2.5 rounded-full transition-all disabled:cursor-not-allowed shadow-md hover:shadow-lg"
        disabled={!draft.trim() || isTyping || !!streamingMessageId}
        title="Send message"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
        </svg>
      </button>
    </form>
  </footer>
</div>
