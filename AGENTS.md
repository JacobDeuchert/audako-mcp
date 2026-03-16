# AGENTS.md

Monorepo with npm workspaces.

## Packages

- `@audako/contracts` (`packages/contracts`): shared types
- `@audako/copilot` (`packages/copilot`): LLM agent backend
- `@audako/chat-ui` (`packages/chat-ui`): Svelte 5 chat widget

## Code Style
- Use comments only when necessary to explain complex logic. Strive for self-explanatory code.
- Don't keep old functions or code snippets as we are in early development. If you need to reference old code, use version control history.
- Use bimome for linting and formatting.


For package-specific guidance, see `packages/*/AGENTS.md`.