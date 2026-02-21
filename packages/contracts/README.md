# @audako/contracts

Shared TypeScript contracts for Audako packages and external clients.

## Scope

This package contains wire-level contracts for:

- Backend bridge HTTP + websocket payloads
- MCP-published websocket event payloads (`entity.created`, `entity.updated`)
- Shared question payloads (`question.ask` flow)
- Common API error shape

It intentionally excludes package-internal runtime types.

WebSocket event contracts are also available as a dedicated subpath:

- `@audako/contracts/backend-bridge/ws-events`

## Install

```bash
npm install @audako/contracts
```

## Usage

```ts
import type {
  ErrorResponse,
  SessionBootstrapRequest,
  SessionBootstrapResponse,
  SessionInfoResponse,
} from '@audako/contracts';

export async function bootstrapSession(
  baseUrl: string,
  body: SessionBootstrapRequest,
): Promise<SessionBootstrapResponse> {
  const response = await fetch(`${baseUrl}/api/session/bootstrap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const payload: unknown = await response.json();

  if (!response.ok) {
    const error = payload as ErrorResponse;
    throw new Error(error.message);
  }

  return payload as SessionBootstrapResponse;
}

export async function getSessionInfo(
  baseUrl: string,
  sessionId: string,
  bridgeSessionToken: string,
): Promise<SessionInfoResponse> {
  const response = await fetch(`${baseUrl}/api/session/${encodeURIComponent(sessionId)}/info`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${bridgeSessionToken}`,
    },
  });

  return (await response.json()) as SessionInfoResponse;
}
```
