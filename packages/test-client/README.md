# @audako/test-client

Simple test client for `@audako/chat-ui`. Just edit the config file and run.

## Quick Start

```bash
# 1. Edit the config
packages/test-client/src/config.ts

# 2. Run the dev server
npm run dev --workspace @audako/test-client
```
The app starts at `http://localhost:5174`

## Features

- **Two-column layout**: WebSocket/event log on the left, chat widget on the right
- **Live event logging**: See all adapter events, streaming chunks, and responses in real-time
- **Simple config**: Just edit `src/config.ts` to change session info, auth tokens, and URLs

## Configuration
The app starts at `http://localhost:5174`

## Configuration

All settings are in `src/config.ts`:

```typescript
export const config = {
  // Connection settings
  appUrl: 'http://localhost:3000',
  scadaUrl: 'https://scada.example.com',
  accessToken: 'your-access-token-here',

  // Session context
  sessionInfo: {
    tenantId: 'demo-tenant',
    groupId: 'demo-group',
    entityType: 'signal',
    app: 'designer',
  },

  // Chat settings
  chat: {
    title: 'Test Assistant',
    initialMessage: 'Hello! How can I help you today?',
    placeholder: 'Type your message...',
    showThinking: true,
  },

  // Theme
  theme: {
    primary: '#0057B8',
    secondary: '#146C5B',
    darkMode: false,
  },
};
```

## Build

```bash
npm run build --workspace @audako/test-client
```
