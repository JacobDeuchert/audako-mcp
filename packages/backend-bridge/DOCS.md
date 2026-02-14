# Backend Bridge - Deployment & API Documentation

## Table of Contents
1. [Installation & Setup](#installation--setup)
2. [Configuration](#configuration)
3. [Running the Service](#running-the-service)
4. [API Reference](#api-reference)
5. [Deployment Guide](#deployment-guide)
6. [Monitoring & Operations](#monitoring--operations)
7. [Troubleshooting](#troubleshooting)

---

## Installation & Setup

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Access to the monorepo containing the MCP server package

### Step 1: Install Dependencies

```bash
cd packages/backend-bridge
npm install
```

This will install:
- `fastify` - HTTP server framework
- `@opencode-ai/sdk` - OpenCode server management
- `pino` - Structured logging
- `dotenv` - Environment configuration
- `@fastify/cors` - CORS support
- TypeScript and development tools

### Step 2: Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your settings (see [Configuration](#configuration) section).

### Step 3: Build TypeScript

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

---

## Configuration

### Environment Variables

Create a `.env` file in the `packages/backend-bridge` directory:

```bash
# Backend Bridge Configuration
PORT=3000                          # Port for the Backend Bridge API
HOST=0.0.0.0                      # Host to bind to (0.0.0.0 = all interfaces)

# OpenCode Server Configuration
OPENCODE_BASE_PORT=30000          # Starting port for OpenCode instances
OPENCODE_MAX_PORT=31000           # Maximum port (creates pool of 1000 ports)
OPENCODE_MAX_SERVERS=50           # Maximum concurrent OpenCode servers
OPENCODE_IDLE_TIMEOUT=3600000     # Idle timeout in milliseconds (1 hour)
OPENCODE_CLEANUP_INTERVAL=900000  # Cleanup check interval (15 minutes)

# Default Model
DEFAULT_MODEL=anthropic/claude-sonnet-4-20250514

# Logging
LOG_LEVEL=info                    # Logging level: debug, info, warn, error
```

### Configuration Options Explained

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | HTTP port for the Backend Bridge API |
| `HOST` | 0.0.0.0 | Network interface to bind (0.0.0.0 = all, 127.0.0.1 = localhost only) |
| `OPENCODE_BASE_PORT` | 30000 | First port in the allocation pool |
| `OPENCODE_MAX_PORT` | 31000 | Last port in the allocation pool (exclusive) |
| `OPENCODE_MAX_SERVERS` | 50 | Maximum number of concurrent OpenCode server instances |
| `OPENCODE_IDLE_TIMEOUT` | 3600000 | Time in ms before idle servers are cleaned up (1 hour) |
| `OPENCODE_CLEANUP_INTERVAL` | 900000 | How often to check for idle servers (15 minutes) |
| `DEFAULT_MODEL` | anthropic/claude-sonnet-4-20250514 | Default AI model for SCADA agent |
| `LOG_LEVEL` | info | Logging verbosity (debug, info, warn, error) |

---

## Running the Service

### Development Mode

Runs with auto-reload on file changes:

```bash
npm run dev
```

Output:
```
{"level":30,"time":1701964800000,"name":"backend-bridge","msg":"Backend Bridge server started","port":3000,"host":"0.0.0.0"}
```

### Production Mode

Build and run compiled code:

```bash
npm run build
npm start
```

### Using Process Manager (PM2)

Recommended for production:

```bash
# Install PM2 globally
npm install -g pm2

# Start the service
pm2 start dist/index.js --name backend-bridge

# View logs
pm2 logs backend-bridge

# Monitor
pm2 monit

# Restart
pm2 restart backend-bridge

# Stop
pm2 stop backend-bridge
```

### Using Docker (Optional)

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy built application
COPY dist ./dist
COPY prompts ./prompts

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "dist/index.js"]
```

Build and run:

```bash
docker build -t backend-bridge .
docker run -p 3000:3000 --env-file .env backend-bridge
```

---

## API Reference

Base URL: `http://localhost:3000`

### 1. Create or Get OpenCode Server

Creates a new OpenCode server instance or returns an existing one for the given SCADA credentials.

**Endpoint:** `POST /api/opencode/create`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "scadaUrl": "https://scada.example.com",
  "accessToken": "Bearer your-access-token-here",
  "model": "anthropic/claude-sonnet-4-20250514"  // Optional
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `scadaUrl` | string | Yes | URL of the SCADA system |
| `accessToken` | string | Yes | Access token for SCADA authentication |
| `model` | string | No | AI model to use (defaults to config value) |

**Success Response (New Server Created):**

```json
{
  "opencodeUrl": "http://localhost:30001",
  "isNew": true,
  "scadaUrl": "https://scada.example.com"
}
```

**Success Response (Existing Server Returned):**

```json
{
  "opencodeUrl": "http://localhost:30001",
  "isNew": false,
  "scadaUrl": "https://scada.example.com"
}
```

**Status Codes:**
- `200 OK` - Server created or retrieved successfully
- `400 Bad Request` - Missing required fields
- `500 Internal Server Error` - Server creation failed

**Error Response:**

```json
{
  "error": "Failed to create OpenCode server",
  "message": "Maximum server limit reached (50)"
}
```

**Example with cURL:**

```bash
curl -X POST http://localhost:3000/api/opencode/create \
  -H "Content-Type: application/json" \
  -d '{
    "scadaUrl": "https://scada.example.com",
    "accessToken": "Bearer abc123xyz",
    "model": "anthropic/claude-sonnet-4-20250514"
  }'
```

**Example with JavaScript:**

```javascript
const response = await fetch('http://localhost:3000/api/opencode/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    scadaUrl: 'https://scada.example.com',
    accessToken: 'Bearer abc123xyz',
    model: 'anthropic/claude-sonnet-4-20250514'
  })
});

const data = await response.json();
console.log('OpenCode Server URL:', data.opencodeUrl);
console.log('Is New Server:', data.isNew);
```

**Example with Python:**

```python
import requests

response = requests.post('http://localhost:3000/api/opencode/create', json={
    'scadaUrl': 'https://scada.example.com',
    'accessToken': 'Bearer abc123xyz',
    'model': 'anthropic/claude-sonnet-4-20250514'
})

data = response.json()
print(f"OpenCode Server URL: {data['opencodeUrl']}")
print(f"Is New Server: {data['isNew']}")
```

---

### 2. Health Check

Returns the current status and metrics of the Backend Bridge service.

**Endpoint:** `GET /health`

**Request Headers:** None required

**Success Response:**

```json
{
  "status": "ok",
  "activeServers": 12,
  "maxServers": 50,
  "availablePorts": 988
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Service status (always "ok" if responding) |
| `activeServers` | number | Number of currently running OpenCode servers |
| `maxServers` | number | Maximum allowed concurrent servers |
| `availablePorts` | number | Number of ports still available in the pool |

**Status Codes:**
- `200 OK` - Health check successful

**Example with cURL:**

```bash
curl http://localhost:3000/health
```

**Use Cases:**
- Load balancer health checks
- Monitoring systems (Prometheus, Datadog, etc.)
- Capacity planning
- Alerting when approaching limits

---

### 3. List Active Servers

Returns detailed information about all currently active OpenCode server instances. Useful for debugging and monitoring.

**Endpoint:** `GET /api/opencode/servers`

**Request Headers:** None required

**Success Response:**

```json
{
  "servers": [
    {
      "scadaUrl": "https://scada.example.com",
      "opencodeUrl": "http://localhost:30001",
      "port": 30001,
      "createdAt": "2024-12-07T10:00:00.000Z",
      "lastAccessedAt": "2024-12-07T10:45:00.000Z",
      "idleMinutes": 15
    },
    {
      "scadaUrl": "https://scada2.example.com",
      "opencodeUrl": "http://localhost:30002",
      "port": 30002,
      "createdAt": "2024-12-07T09:30:00.000Z",
      "lastAccessedAt": "2024-12-07T11:00:00.000Z",
      "idleMinutes": 0
    }
  ]
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `scadaUrl` | string | SCADA system URL |
| `opencodeUrl` | string | URL to access the OpenCode server |
| `port` | number | Port the server is running on |
| `createdAt` | string (ISO 8601) | When the server was created |
| `lastAccessedAt` | string (ISO 8601) | Last time the server was accessed |
| `idleMinutes` | number | Minutes since last access |

**Status Codes:**
- `200 OK` - Server list retrieved successfully

**Example with cURL:**

```bash
curl http://localhost:3000/api/opencode/servers
```

**Example with JavaScript:**

```javascript
const response = await fetch('http://localhost:3000/api/opencode/servers');
const data = await response.json();

console.log(`Active Servers: ${data.servers.length}`);
data.servers.forEach(server => {
  console.log(`${server.scadaUrl} - Port ${server.port} - Idle: ${server.idleMinutes} min`);
});
```

**Use Cases:**
- Debugging server allocation issues
- Monitoring which SCADA systems have active sessions
- Identifying servers approaching idle timeout
- Operational visibility

---

## Deployment Guide

### Production Deployment Checklist

- [ ] Environment variables configured in `.env`
- [ ] TypeScript compiled (`npm run build`)
- [ ] Firewall rules configured (allow port 3000)
- [ ] Process manager installed (PM2 recommended)
- [ ] Log rotation configured
- [ ] Monitoring alerts set up
- [ ] Backup/recovery plan documented

### Hosting Options

#### 1. Bare Metal / VM

**Requirements:**
- Ubuntu 20.04+ or similar Linux distribution
- Node.js 18+
- 2GB RAM minimum (4GB recommended)
- 10GB disk space

**Setup:**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Create service user
sudo useradd -r -s /bin/false backend-bridge

# Deploy application
sudo mkdir -p /opt/backend-bridge
sudo cp -r dist prompts package*.json /opt/backend-bridge/
cd /opt/backend-bridge
sudo npm ci --only=production

# Create .env file
sudo nano /opt/backend-bridge/.env

# Set permissions
sudo chown -R backend-bridge:backend-bridge /opt/backend-bridge
```

**Systemd Service:**

Create `/etc/systemd/system/backend-bridge.service`:

```ini
[Unit]
Description=Backend Bridge Service
After=network.target

[Service]
Type=simple
User=backend-bridge
WorkingDirectory=/opt/backend-bridge
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=backend-bridge
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable backend-bridge
sudo systemctl start backend-bridge
sudo systemctl status backend-bridge
```

#### 2. Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend-bridge:
    build: .
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - HOST=0.0.0.0
      - OPENCODE_BASE_PORT=30000
      - OPENCODE_MAX_PORT=31000
      - OPENCODE_MAX_SERVERS=50
      - LOG_LEVEL=info
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
```

Run:

```bash
docker-compose up -d
```

#### 3. Kubernetes

Create `deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-bridge
spec:
  replicas: 1  # Single instance for in-memory registry
  selector:
    matchLabels:
      app: backend-bridge
  template:
    metadata:
      labels:
        app: backend-bridge
    spec:
      containers:
      - name: backend-bridge
        image: your-registry/backend-bridge:latest
        ports:
        - containerPort: 3000
        env:
        - name: PORT
          value: "3000"
        - name: HOST
          value: "0.0.0.0"
        - name: OPENCODE_BASE_PORT
          value: "30000"
        - name: OPENCODE_MAX_PORT
          value: "31000"
        - name: OPENCODE_MAX_SERVERS
          value: "50"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: backend-bridge
spec:
  selector:
    app: backend-bridge
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

Deploy:

```bash
kubectl apply -f deployment.yaml
```

### Reverse Proxy Setup (Nginx)

Create `/etc/nginx/sites-available/backend-bridge`:

```nginx
upstream backend_bridge {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name bridge.example.com;

    # HTTPS redirect
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name bridge.example.com;

    ssl_certificate /etc/letsencrypt/live/bridge.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bridge.example.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://backend_bridge;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/backend-bridge /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Monitoring & Operations

### Log Management

**View Logs (PM2):**

```bash
pm2 logs backend-bridge --lines 100
```

**View Logs (Systemd):**

```bash
sudo journalctl -u backend-bridge -f
```

**Log Format (JSON):**

```json
{
  "level": 30,
  "time": 1701964800000,
  "name": "backend-bridge",
  "msg": "OpenCode server created and registered",
  "scadaUrl": "https://scada.example.com",
  "port": 30001,
  "activeServers": 1
}
```

### Metrics to Monitor

1. **Active Servers** - Track via `/health` endpoint
2. **Port Utilization** - Monitor available ports
3. **Request Rate** - Requests to `/api/opencode/create`
4. **Error Rate** - 500 responses
5. **Cleanup Activity** - Servers removed per hour
6. **Response Time** - Average time to create server

### Prometheus Integration Example

```javascript
// Add to server.ts
import promClient from 'prom-client';

const register = new promClient.Registry();
const activeServersGauge = new promClient.Gauge({
  name: 'backend_bridge_active_servers',
  help: 'Number of active OpenCode servers',
  registers: [register]
});

// Update gauge
fastify.get('/metrics', async (request, reply) => {
  activeServersGauge.set(serverRegistry.getActiveServerCount());
  return reply.type('text/plain').send(await register.metrics());
});
```

---

## Troubleshooting

### Problem: Service won't start

**Check logs:**
```bash
pm2 logs backend-bridge --err
# or
sudo journalctl -u backend-bridge -n 50
```

**Common causes:**
- Port 3000 already in use: Change `PORT` in `.env`
- Missing dependencies: Run `npm install`
- Missing `.env` file: Copy from `.env.example`
- Permission issues: Check file ownership

### Problem: "Maximum server limit reached"

**Solution:**
- Increase `OPENCODE_MAX_SERVERS` in `.env`
- Check for idle servers: `curl http://localhost:3000/api/opencode/servers`
- Wait for cleanup cycle (15 minutes)
- Manually restart service to clear all servers

### Problem: "No available ports in pool"

**Solution:**
- Increase `OPENCODE_MAX_PORT` in `.env`
- Check port conflicts: `netstat -tulpn | grep 300`
- Restart service to reset port allocator

### Problem: Servers not cleaning up

**Check:**
- Cleanup task is running (check logs for "Idle server cleanup completed")
- Verify `OPENCODE_IDLE_TIMEOUT` is set correctly
- Check `OPENCODE_CLEANUP_INTERVAL` for frequency

**Manual cleanup:**
```bash
# Restart service to force cleanup
pm2 restart backend-bridge
```

### Problem: High memory usage

**Check:**
- Number of active servers: `curl http://localhost:3000/health`
- Reduce `OPENCODE_MAX_SERVERS`
- Reduce `OPENCODE_IDLE_TIMEOUT` for faster cleanup

### Debug Mode

Enable debug logging:

```bash
# In .env
LOG_LEVEL=debug
```

Restart service and check detailed logs.

---

## Security Recommendations

1. **Use HTTPS** - Always use reverse proxy with SSL
2. **Firewall** - Restrict port 3000 to localhost if using reverse proxy
3. **CORS** - Configure specific origins instead of allowing all
4. **Rate Limiting** - Add rate limiting middleware (future enhancement)
5. **Token Validation** - Consider adding JWT validation (future enhancement)
6. **Network Segmentation** - Run in isolated network segment

---

## Support & Maintenance

### Regular Maintenance Tasks

**Weekly:**
- Review logs for errors
- Check server utilization trends
- Verify cleanup task running

**Monthly:**
- Update dependencies: `npm update`
- Review capacity limits
- Analyze usage patterns

**Quarterly:**
- Security updates
- Performance optimization
- Documentation updates

### Backup & Recovery

**No persistent data** - Service is stateless (in-memory registry)

**Recovery:**
1. Stop service
2. Deploy new version
3. Start service
4. All servers will be recreated on demand

---

## Quick Reference

```bash
# Development
npm run dev                        # Start with hot reload

# Production
npm run build                      # Compile TypeScript
npm start                          # Run compiled code
pm2 start dist/index.js           # Run with PM2

# Testing
curl http://localhost:3000/health  # Health check

# Monitoring
pm2 logs backend-bridge           # View logs
pm2 monit                         # Real-time monitoring
```

---

