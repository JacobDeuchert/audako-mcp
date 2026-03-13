---
name: audako-api-overview
description: Overview of common audako API patterns and integration approaches
---

# Audako API Overview

## Base Architecture

Audako follows a hierarchical model:
```
Tenant
  └── Group
        └── Device (Entity)
```

## Common API Patterns

### REST Endpoints

```typescript
// Entity operations
GET    /api/entities          // List entities
GET    /api/entities/{id}     // Get single entity
POST   /api/entities          // Create entity
PATCH  /api/entities/{id}     // Update entity
DELETE /api/entities/{id}     // Delete entity
```

### WebSocket Sessions

```typescript
// Real-time updates
const ws = new WebSocket('ws://localhost:3000/session');

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  // Handle entity updates
};
```

## Response Format

```typescript
{
  "data": Entity | Entity[],
  "meta": {
    "page": 1,
    "pageSize": 50,
    "total": 200
  }
}
```

## Error Handling

```typescript
// Standard error format
{
  "error": {
    "code": "ENTITY_NOT_FOUND",
    "message": "Entity with id 'xyz' not found"
  }
}
```

## Authentication

Include API key in headers:
```typescript
headers: {
  'Authorization': 'Bearer YOUR_API_KEY',
  'Content-Type': 'application/json'
}
```

## Rate Limiting

- Default: 100 requests per minute
- WebSocket: 1000 messages per minute
- Exceeded limits return 429 status
