# Resource Example

This file is an example documentation resource exposed by the Audako MCP server.

## Resource URIs

- `docs://index` returns all available doc filenames.
- `docs://files/resource-example.md` returns this document.

## Recommended LLM Startup Behavior

1. Read `docs://index` at session startup.
2. Select relevant files from the list.
3. Read those files using `docs://files/{filename}` before planning or tool calls.

## Notes

- Documentation resources are read-only.
- The server auto-discovers all markdown files in the docs directory.
