---
name: mcp-server-debug
description: Debug MCP server connectivity, configuration, and common issues
---

# MCP Server Debug

## Check Server Health

```bash
curl http://localhost:3000/health
```

## Common Issues

### Connection Refused
- Server not running on expected port
- Check process: `ps aux | grep audako`
- Start server: `npm run dev`

### Authentication Errors
- Verify API key in environment variables
- Check `.env` file for MCP_API_KEY
- Regenerate key if needed

### Timeout Issues
- Network connectivity problems
- Firewall blocking port 3000
- Check: `telnet localhost 3000`
