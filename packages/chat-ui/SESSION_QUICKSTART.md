# Session Quickstart (Copilot + chat-ui)

This is the minimal client flow to bootstrap a session and run `@audako/chat-ui` over WebSocket.

## 1) Bootstrap a session

Call the copilot bootstrap endpoint:

```ts
const baseUrl = 'http://localhost:3000';

const bootstrapResponse = await fetch(`${baseUrl}/api/session/bootstrap`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    scadaUrl: 'https://your-scada-url',
    accessToken: '<scada-access-token>',
    sessionInfo: {
      tenantId: 'tenant-a',
      groupId: 'group-1',
      entityType: 'device',
      app: 'scada',
    },
  }),
});

if (!bootstrapResponse.ok) {
  throw new Error(`Bootstrap failed: ${bootstrapResponse.status}`);
}

const bootstrap = await bootstrapResponse.json() as {
  sessionId: string;
  websocketPath: string;
  bridgeSessionToken: string;
};
```

## 2) Create and initialize the adapter

```ts
import { WebSocketAdapter } from '@audako/chat-ui';

const adapter = new WebSocketAdapter({
  baseUrl,
  websocketPath: bootstrap.websocketPath,
  sessionToken: bootstrap.bridgeSessionToken,
  sessionId: bootstrap.sessionId,
  onDebugEvent: (event) => {
    console.log(`[ws.${event.type}]`, event.payload);
  },
  onCustomEvent: (event) => {
    if (event.type === 'my.tool.progress') {
      console.log('Custom tool event', event.payload);
    }
  },
});

await adapter.init();
```

## 3) Mount `ChatWidget`

```svelte
<script lang="ts">
  import { ChatWidget, type ChatWidgetConfig } from '@audako/chat-ui';
  import '@audako/chat-ui/style.css';

  export let adapter;

  const config: ChatWidgetConfig = {
    adapter,
    title: 'Audako Assistant',
    placeholder: 'Ask anything...',
  };
</script>

<ChatWidget {config} />
```

## 4) What is handled automatically

- Sending chat input (`user_message`) and streaming response events (`agent.text_delta`, `agent.turn_start`, `agent.turn_end`, `agent.error`).
- Interactive questions (`hub.request`) from copilot; `ChatWidget` shows the question UI and adapter replies with `hub.response`.
- Heartbeat (`ping`/`pong`) and reconnect behavior.
- Forwarding unhandled session events to `onCustomEvent`.

## 5) Optional session metadata updates over WebSocket

You can push session metadata updates without HTTP:

```ts
await adapter.updateSessionInfo({
  tenantId: 'tenant-a',
  groupId: 'group-2',
  entityType: 'device',
  app: 'scada',
});
```

The server applies the update and broadcasts `session.info.updated`.

## 6) Teardown

```ts
adapter.disconnect();
```
