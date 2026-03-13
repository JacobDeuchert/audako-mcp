---
name: entity-query-guide
description: Guide for querying audako entities effectively by type, group, and filters
---

# Entity Query Guide

## Entity Types

Audako entities include:
- **Device**: Physical SCADA devices and sensors
- **Group**: Logical collections of devices
- **Tenant**: Top-level organizational units

## Query Patterns

### By Entity Type

```typescript
// Query all devices
GET /api/entities?type=Device

// Query all groups
GET /api/entities?type=Group
```

### By Group Membership

```typescript
// Get entities in a specific group
GET /api/entities?groupId={groupId}

// Include child groups
GET /api/entities?groupId={groupId}&recursive=true
```

### By Tenant

```typescript
// All entities in a tenant
GET /api/entities?tenantId={tenantId}
```

## Filtering

### Common Filters

```typescript
// Active entities only
GET /api/entities?status=active

// By name pattern
GET /api/entities?name=*sensor*

// Combined filters
GET /api/entities?type=Device&status=active&groupId={id}
```

### Pagination

```typescript
// Paginated results
GET /api/entities?page=1&pageSize=50

// With sorting
GET /api/entities?sortBy=name&sortOrder=asc
```

## Best Practices

- Use specific filters to reduce result sets
- Prefer `groupId` over tenant-wide queries
- Use pagination for large datasets
- Cache entity metadata when possible
