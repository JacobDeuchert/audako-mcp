# Session Quickstart (Copilot + chat-ui)

This is the minimal client flow to bootstrap a session and run `@audako/chat-ui` over Socket.IO.

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
  realtime: {
    transport: 'socket.io';
    namespace: '/session';
    path: string;
    auth: {
      type: 'session_token';
      token: string;
    };
  };
};
```

## 2) Create and initialize the adapter

```ts
import { SocketIOAdapter } from '@audako/chat-ui';

const adapter = new SocketIOAdapter({
  baseUrl,
  realtime: bootstrap.realtime,
  sessionId: bootstrap.sessionId,
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

- Sending prompts with `prompt.send` and streaming assistant text via `assistant.delta` and `assistant.done`.
- Interactive questions via `question.ask`; `ChatWidget` shows the question UI and the adapter replies with `question.answer`.
- Session metadata updates via `session.update`.
- Socket.IO reconnection.

## 5) Optional session metadata updates

You can push session metadata updates over the realtime connection:

```ts
await adapter.updateSessionInfo({
  tenantId: 'tenant-a',
  groupId: 'group-2',
  entityType: 'device',
  app: 'scada',
});
```

The server applies the update and acknowledges the command.

## 6) Teardown

```ts
adapter.disconnect();
```
