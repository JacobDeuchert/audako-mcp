<script lang="ts">
  import { ChatWidget, MockAdapter, type ChatWidgetConfig } from './lib';

  const adapter = new MockAdapter({ showThinking: true });

  let config: ChatWidgetConfig = {
    adapter,
    title: 'Audako Assistant',
    initialMessage: 'Welcome to Audako MCP Chat. I can show you my thinking process!',
    placeholder: 'Type a message'
  };

  let primary = '#0057B8';
  let secondary = '#146C5B';
  let darkMode = false;
</script>

{#snippet widgetHeader(title: string)}
  <div class="flex items-center justify-between gap-3">
    <h2 class="text-sm font-medium text-slate-900 leading-tight">{title}</h2>
    <span class="text-xs text-slate-500">Chat</span>
  </div>
{/snippet}

<main class="min-h-screen flex items-center justify-center">
  <div class="max-w-4xl w-full px-6 py-10">
    <h1 class="text-3xl font-semibold text-slate-900 mb-4">Audako Chat UI</h1>
    <p class="text-slate-600 mb-6">This preview renders the widget as a regular Svelte component.</p>

    <section class="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-6">
      <div class="grid md:grid-cols-[1fr,300px] gap-6 items-start">
        <div class="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
          <ChatWidget {config} header={widgetHeader} {primary} {secondary} {darkMode} />
        </div>
        <div class="space-y-3 text-sm text-slate-600">
          <p>Import the component directly in your Svelte app (including Chrome extensions).</p>
          <label class="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" bind:checked={darkMode} />
            Dark mode
          </label>
          <div class="bg-slate-900 text-slate-100 rounded-xl p-3 font-mono text-xs">
            import {'{'} ChatWidget, MockAdapter {'}'} from '@audako/chat-ui';<br />
            import '@audako/chat-ui/style.css';
          </div>
        </div>
      </div>
    </section>
  </div>
</main>
