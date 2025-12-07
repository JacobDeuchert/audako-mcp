# @audako/chat-ui

A beautiful LLM chat UI built with Svelte 5 and Tailwind CSS. Features a modern gradient design, typing indicators, message timestamps, and smooth animations.

## ✨ Features

- 🎨 Modern, beautiful gradient design
- 💬 Real-time message display with typing indicators  
- 👤 User and assistant avatars
- ⏰ Message timestamps
- 📱 Fully responsive
- 🔌 Embeddable as web component (`<audako-chat>`)
- ⚡ Built with Svelte 5 runes for optimal performance

## 🚀 Scripts

- `npm run dev` — Vite dev server for local UI development
- `npm run build` — Standard app build
- `npm run build:wc` — Library build for the `audako-chat` web component
- `npm run preview` — Preview production build
- `npm run check` — Type and Svelte checks

## 📦 Web Component Usage

Import and register the element in another app:

```js
import { registerChatWidget } from '@audako/chat-ui';

registerChatWidget(); // defines <audako-chat>
```

Or load the built bundle from `dist/audako-chat.js` and use `<audako-chat>` in HTML.

## 🔌 Backend Integration

The UI currently uses simulated responses. To connect to a real LLM backend:

1. Edit `src/lib/ChatWidget.svelte`
2. Replace `simulateResponse()` with your API call
3. Update the `send()` function to handle real backend communication
4. Consider adding streaming support for real-time LLM responses
