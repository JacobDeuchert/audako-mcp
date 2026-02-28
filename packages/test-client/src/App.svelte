<script lang="ts">
  import { onMount } from 'svelte';
  import {
    ChatWidget,
    OpenCodeAdapter,
    type ChatWidgetConfig,
    type ChatAdapter,
    type StreamCallbacks,
    type ChatRequest,
  } from '@audako/chat-ui';
  import '@audako/chat-ui/style.css';
  import { config } from './config';

  type LogEntry = { timestamp: string; type: string; data: unknown };

  const MAX_LOG_ENTRIES = 200;

  let opencodeLogs = $state<LogEntry[]>([]);
  let copilotWsLogs = $state<LogEntry[]>([]);
  let autoScroll = $state(true);
  let activeLogTab = $state<'opencode' | 'copilot-ws'>('opencode');
  let adapter = $state<ChatAdapter | null>(null);
  let isBootstrapping = $state(true);
  let bootstrapError = $state<string | null>(null);
  let activeSessionId = $state<string | null>(null);
  let copilotSocket: WebSocket | null = null;

  function appendLog(target: 'opencode' | 'copilot-ws', type: string, data: unknown) {
    const entry = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      data,
    };

    if (target === 'opencode') {
      opencodeLogs = [...opencodeLogs, entry];
      if (opencodeLogs.length > MAX_LOG_ENTRIES) {
        opencodeLogs = opencodeLogs.slice(-MAX_LOG_ENTRIES);
      }
      return;
    }

    copilotWsLogs = [...copilotWsLogs, entry];
    if (copilotWsLogs.length > MAX_LOG_ENTRIES) {
      copilotWsLogs = copilotWsLogs.slice(-MAX_LOG_ENTRIES);
    }
  }

  function addOpencodeLog(type: string, data: unknown) {
    appendLog('opencode', type, data);
  }

  function addCopilotWsLog(type: string, data: unknown) {
    appendLog('copilot-ws', type, data);
  }

  // Create a logging wrapper around the adapter
  function createLoggingAdapter(baseAdapter: ChatAdapter): ChatAdapter {
    return {
      async init() {
        addOpencodeLog('adapter.init', { adapter: baseAdapter.constructor.name });
        if (baseAdapter.init) {
          await baseAdapter.init();
        }
      },
      
      cancel() {
        addOpencodeLog('adapter.cancel', {});
        if (baseAdapter.cancel) {
          baseAdapter.cancel();
        }
      },
      
      async sendMessage(request: ChatRequest, callbacks: StreamCallbacks) {
        addOpencodeLog('adapter.sendMessage', {
          message: request.message,
          historyLength: request.conversationHistory?.length,
        });
        
        // Wrap callbacks to log events
        const wrappedCallbacks: StreamCallbacks = {
          onChunk: (text: string) => {
            addOpencodeLog('stream.chunk', { textLength: text.length, preview: text.slice(0, 50) });
            callbacks.onChunk(text);
          },
          onComplete: () => {
            addOpencodeLog('stream.complete', {});
            callbacks.onComplete();
          },
          onError: (error: Error) => {
            addOpencodeLog('stream.error', { error: error.message });
            callbacks.onError(error);
          },
          onThinking: callbacks.onThinking ? (text: string) => {
            addOpencodeLog('stream.thinking', { textLength: text.length });
            callbacks.onThinking!(text);
          } : undefined,
          onQuestion: callbacks.onQuestion ? async (question) => {
            addOpencodeLog('stream.question', {
              text: question.text,
              optionsCount: question.options?.length,
            });
            const result = await callbacks.onQuestion!(question);
            addOpencodeLog('stream.question.response', { result });
            return result;
          } : undefined,
        };
        
        return baseAdapter.sendMessage(request, wrappedCallbacks);
      },
    };
  }

  const widgetConfig = $derived<ChatWidgetConfig | null>(
    adapter
      ? {
          adapter,
          title: config.chat.title,
          initialMessage: config.chat.initialMessage,
          placeholder: config.chat.placeholder,
        }
      : null,
  );

  // Theme from config
  const primary = config.theme.primary;
  const secondary = config.theme.secondary;
  const darkMode = config.theme.darkMode;

  // Session info for display
  const sessionInfo = config.sessionInfo;

  const currentLogs = $derived(activeLogTab === 'opencode' ? opencodeLogs : copilotWsLogs);

  async function bootstrapWithCopilot(): Promise<void> {
    isBootstrapping = true;
    bootstrapError = null;
    adapter = null;
    activeSessionId = null;

    if (copilotSocket) {
      copilotSocket.close(1000, 'restart');
      copilotSocket = null;
    }

    addCopilotWsLog('bootstrap.request', {
      url: `${config.appUrl}/api/session/bootstrap`,
      hasSessionInfo: Boolean(config.sessionInfo),
    });

    const response = await fetch(`${config.appUrl}/api/session/bootstrap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scadaUrl: config.scadaUrl,
        accessToken: config.accessToken,
        sessionInfo: config.sessionInfo,
      }),
    });

    if (!response.ok) {
      const message = `Bootstrap failed: ${response.status} ${response.statusText}`;
      addCopilotWsLog('bootstrap.error', { message });
      throw new Error(message);
    }

    const payload = (await response.json()) as {
      sessionId: string;
      opencodeUrl: string;
      websocketUrl: string;
    };

    activeSessionId = payload.sessionId;

    addCopilotWsLog('bootstrap.success', {
      sessionId: payload.sessionId,
      opencodeUrl: payload.opencodeUrl,
      websocketUrl: payload.websocketUrl,
    });

    const baseAdapter = new OpenCodeAdapter({
      baseUrl: payload.opencodeUrl,
      sessionId: payload.sessionId,
      createSession: false,
      agent: 'audako',
      logCombinedEvents: false,
    });

    adapter = createLoggingAdapter(baseAdapter);

    addCopilotWsLog('websocket.connecting', { url: payload.websocketUrl });
    copilotSocket = new WebSocket(payload.websocketUrl);

    copilotSocket.addEventListener('open', () => {
      addCopilotWsLog('websocket.open', { url: payload.websocketUrl });
    });

    copilotSocket.addEventListener('close', event => {
      addCopilotWsLog('websocket.close', {
        url: payload.websocketUrl,
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
      });
    });

    copilotSocket.addEventListener('error', () => {
      addCopilotWsLog('websocket.error', { url: payload.websocketUrl });
    });

    copilotSocket.addEventListener('message', event => {
      const messageData = typeof event.data === 'string' ? event.data : '[binary message]';
      addCopilotWsLog('websocket.message', {
        url: payload.websocketUrl,
        preview: messageData.slice(0, 120),
        length: messageData.length,
      });
    });
  }

  async function retryBootstrap() {
    await bootstrapWithCopilot().catch(error => {
      bootstrapError = error instanceof Error ? error.message : String(error);
    }).finally(() => {
      isBootstrapping = false;
    });
  }

  onMount(() => {
    void bootstrapWithCopilot().catch(error => {
      bootstrapError = error instanceof Error ? error.message : String(error);
    }).finally(() => {
      isBootstrapping = false;
    });

    return () => {
      if (copilotSocket) {
        copilotSocket.close(1000, 'unmount');
        copilotSocket = null;
      }
    };
  });

  function clearLogs() {
    if (activeLogTab === 'opencode') {
      opencodeLogs = [];
      return;
    }
    copilotWsLogs = [];
  }

  function toggleAutoScroll() {
    autoScroll = !autoScroll;
  }
</script>

{#snippet widgetHeader(title: string)}
  <div class="flex items-center justify-between gap-3">
    <h2 class="text-sm font-medium leading-tight">{title}</h2>
    <span class="text-xs opacity-70 px-2 py-1 bg-black/5 rounded-full">
      {sessionInfo.entityType}
    </span>
  </div>
{/snippet}

<main class="h-screen flex flex-col p-4 overflow-hidden">
  <div class="w-full flex flex-col flex-1 min-h-0">
    <!-- Header -->
    <header class="mb-4 flex items-center justify-between shrink-0">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">{config.chat.title}</h1>
        <p class="text-sm text-slate-500">
          {config.appUrl} • {sessionInfo.tenantId}/{sessionInfo.groupId} • {sessionInfo.entityType}
        </p>
        {#if activeSessionId}
          <p class="text-xs text-slate-400">session: {activeSessionId}</p>
        {/if}
      </div>
      <div class="text-xs text-slate-400">
        Edit <code class="bg-slate-200 px-1 rounded">src/config.ts</code> to change settings
      </div>
    </header>

    <!-- Two Column Layout -->
    <div class="flex flex-1 gap-4 min-h-0 flex-col lg:flex-row">
      <!-- Left: Event Log -->
      <div class="w-full lg:basis-[60%] lg:max-w-[60%] bg-slate-900 rounded-xl overflow-hidden flex flex-col min-h-0">
        <!-- Log Header -->
        <div class="bg-slate-800 px-4 py-2 flex items-center justify-between border-b border-slate-700 shrink-0">
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span class="text-sm font-medium text-slate-200">Logs</span>
            </div>
            <div class="flex items-center gap-1 rounded-md bg-slate-700 p-1">
              <button
                class="text-xs px-2 py-1 rounded transition-colors"
                class:bg-slate-200={activeLogTab === 'opencode'}
                class:text-slate-900={activeLogTab === 'opencode'}
                class:text-slate-300={activeLogTab !== 'opencode'}
                onclick={() => (activeLogTab = 'opencode')}
              >
                OpenCode
              </button>
              <button
                class="text-xs px-2 py-1 rounded transition-colors"
                class:bg-slate-200={activeLogTab === 'copilot-ws'}
                class:text-slate-900={activeLogTab === 'copilot-ws'}
                class:text-slate-300={activeLogTab !== 'copilot-ws'}
                onclick={() => (activeLogTab = 'copilot-ws')}
              >
                Copilot WebSocket
              </button>
            </div>
            <span class="text-xs text-slate-400">({currentLogs.length} events)</span>
          </div>
          <div class="flex items-center gap-2">
            <button
              class="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
              onclick={toggleAutoScroll}
            >
              {autoScroll ? '⏸ Pause' : '▶ Resume'}
            </button>
            <button
              class="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
              onclick={clearLogs}
            >
              🗑 Clear
            </button>
          </div>
        </div>

        <!-- Log Content -->
        <div class="flex-1 overflow-auto p-2 font-mono text-xs space-y-1 min-h-0">
          {#if currentLogs.length === 0}
            <div class="text-slate-500 text-center py-8">
              {#if activeLogTab === 'opencode'}
                No OpenCode events yet. Send a message to see logs.
              {:else}
                No Copilot WebSocket events yet.
              {/if}
            </div>
          {:else}
            {#each currentLogs as log, i (i)}
              {@const typeColor = 
                log.type.includes('error') ? 'text-red-400' :
                log.type.includes('chunk') ? 'text-blue-400' :
                log.type.includes('thinking') ? 'text-purple-400' :
                log.type.includes('question') ? 'text-yellow-400' :
                log.type.includes('websocket.open') ? 'text-green-400' :
                log.type.includes('websocket.close') ? 'text-orange-400' :
                log.type.includes('complete') ? 'text-green-400' :
                'text-slate-400'
              }
              <div class="flex gap-2 hover:bg-slate-800/50 rounded px-1 py-0.5">
                <span class="text-slate-600 shrink-0">{log.timestamp}</span>
                <span class="{typeColor} shrink-0 font-medium">{log.type}</span>
                <span class="text-slate-300 truncate">
                  {JSON.stringify(log.data).slice(0, 100)}
                  {JSON.stringify(log.data).length > 100 ? '...' : ''}
                </span>
              </div>
            {/each}
          {/if}
        </div>
      </div>

      <!-- Right: Chat Widget -->
      <div class="w-full lg:basis-[40%] lg:max-w-[40%] bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col min-h-0">
        {#if widgetConfig}
          <ChatWidget
            config={widgetConfig}
            header={widgetHeader}
            {primary}
            {secondary}
            {darkMode}
          />
        {:else}
          <div class="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
            <p class="text-sm font-medium text-slate-700">
              {isBootstrapping ? 'Connecting to Copilot...' : 'Copilot not connected'}
            </p>
            {#if bootstrapError}
              <p class="text-xs text-red-600">{bootstrapError}</p>
              <button
                class="text-xs px-3 py-2 rounded bg-slate-900 text-white hover:bg-slate-700 transition-colors"
                onclick={retryBootstrap}
              >
                Retry Connection
              </button>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
</main>
