<script lang="ts">
  import { onMount } from 'svelte';
  import { registerChatWidget, MockAdapter } from './lib/register';

  onMount(() => {
    // Enable thinking simulation in mock adapter
    const adapter = new MockAdapter({ showThinking: true });
    
    registerChatWidget({
      adapter,
      title: 'Audako Assistant',
      initialMessage: 'Welcome to Audako MCP Chat. I can show you my thinking process!',
      placeholder: 'Type a message'
    });
  });
</script>

<main class="min-h-screen flex items-center justify-center">
  <div class="max-w-3xl w-full px-6">
    <h1 class="text-3xl font-semibold text-slate-900 mb-4">Audako Chat UI</h1>
    <p class="text-slate-600 mb-6">This page renders the chat widget as a custom element.</p>

    <section class="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-6">
      <div class="grid md:grid-cols-[1fr,320px] gap-6 items-start">
        <div>
          <h2 class="text-xl font-semibold text-slate-900 mb-3">Live preview</h2>
          <div class="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
            <audako-chat class="block"></audako-chat>
          </div>
        </div>
        <div class="space-y-3 text-sm text-slate-600">
          <p>
            The component is compiled as a web component. Import <code class="px-1 py-0.5 bg-slate-100 rounded">registerChatWidget</code>
            and drop <code class="px-1 py-0.5 bg-slate-100 rounded">&lt;audako-chat&gt;</code> into any page.
          </p>
          <div class="bg-slate-900 text-slate-100 rounded-xl p-3 font-mono text-xs">
            import {'{'} registerChatWidget {'}'} from '@audako/chat-ui';<br />
            registerChatWidget();
          </div>
        </div>
      </div>
    </section>
  </div>
</main>

<style>
  code {
    font-family: ui-monospace, SFMono-Regular, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
      monospace;
  }
</style>
