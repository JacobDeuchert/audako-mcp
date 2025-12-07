# Integrating Audako Chat UI into Your Web Application

This guide shows you how to integrate the Audako Chat UI web component into your existing web application, including those using Tailwind CSS.

## Installation

### Option 1: Using the Built Web Component (Recommended)

If your app is in the same monorepo:

```bash
npm install @audako/chat-ui
```

If you're using this as a local package in a monorepo, reference it in your `package.json`:

```json
{
  "dependencies": {
    "@audako/chat-ui": "workspace:*"
  }
}
```

### Option 2: Build and Copy

1. Build the web component:
   ```bash
   cd packages/chat-ui
   npm run build:wc
   ```

2. Copy the built files from `dist/` to your project:
   - `dist/audako-chat.js`
   - `dist/audako-chat.css`

## Usage

### In a Vanilla JavaScript/HTML Project

```html
<!DOCTYPE html>
<html>
<head>
  <!-- Include the CSS -->
  <link rel="stylesheet" href="/path/to/audako-chat.css">
</head>
<body>
  <!-- Use the web component -->
  <audako-chat></audako-chat>

  <!-- Include the JavaScript -->
  <script type="module">
    import { registerChatWidget } from '/path/to/audako-chat.js';
    registerChatWidget();
  </script>
</body>
</html>
```

### In a React Project (with or without Tailwind)

```jsx
// App.jsx or App.tsx
import { useEffect } from 'react';
import { registerChatWidget } from '@audako/chat-ui';
import '@audako/chat-ui/style.css';

function App() {
  useEffect(() => {
    registerChatWidget();
  }, []);

  return (
    <div className="container mx-auto p-8">
      <h1>My Application</h1>
      {/* Use the web component */}
      <audako-chat></audako-chat>
    </div>
  );
}

export default App;
```

### In a Vue Project (with or without Tailwind)

```vue
<!-- App.vue -->
<template>
  <div class="container mx-auto p-8">
    <h1>My Application</h1>
    <audako-chat></audako-chat>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { registerChatWidget } from '@audako/chat-ui';
import '@audako/chat-ui/style.css';

onMounted(() => {
  registerChatWidget();
});
</script>
```

### In a Svelte Project

```svelte
<!-- App.svelte -->
<script>
  import { onMount } from 'svelte';
  import { registerChatWidget } from '@audako/chat-ui';
  import '@audako/chat-ui/style.css';

  onMount(() => {
    registerChatWidget();
  });
</script>

<div class="container mx-auto p-8">
  <h1>My Application</h1>
  <audako-chat></audako-chat>
</div>
```

## Using with Tailwind CSS

The chat UI is built with Tailwind CSS and includes all necessary styles in the bundled CSS file. You have two options:

### Option 1: Import Pre-built CSS (Recommended)

Simply import the CSS file as shown in the examples above:

```js
import '@audako/chat-ui/style.css';
```

The bundled CSS contains only the Tailwind utilities used by the chat component, so it won't bloat your application.

### Option 2: Include in Your Tailwind Config (Advanced)

If you want to rebuild the component styles with your own Tailwind configuration:

1. Add the chat UI paths to your `tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './node_modules/@audako/chat-ui/dist/**/*.js', // Add this line
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

2. Import the component without the CSS:

```js
import { registerChatWidget } from '@audako/chat-ui';
// Don't import the CSS - your Tailwind build will handle it
registerChatWidget();
```

## Styling and Customization

The chat widget uses these main Tailwind classes:
- **Background**: `bg-white`, `bg-slate-50`
- **Primary Color**: `bg-blue-600`, `text-blue-600` (Material Design blue)
- **Border**: `border-slate-200`
- **Text**: `text-slate-900`, `text-slate-600`, `text-slate-500`

### Custom Styling

You can override styles using CSS custom properties or by adding CSS rules that target the component:

```css
/* Custom styles for the chat widget */
audako-chat {
  /* Adjust height */
  display: block;
  max-width: 800px;
  margin: 0 auto;
}

/* Override button colors */
audako-chat button[type="submit"] {
  background: linear-gradient(to right, #your-color-1, #your-color-2);
}
```

## TypeScript Support

The package includes TypeScript definitions. For web component types in React with TypeScript:

```tsx
// vite-env.d.ts or global.d.ts
declare namespace JSX {
  interface IntrinsicElements {
    'audako-chat': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
  }
}
```

## API Integration

To connect the chat UI to your backend MCP server, you'll need to modify the `simulateResponse()` function in `ChatWidget.svelte` to call your actual API endpoints.

The component is designed to work with streaming responses. Here's an example of how to integrate it:

```typescript
// In your modified ChatWidget.svelte
const sendToBackend = async (message: string) => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });

  // Handle streaming response
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  
  // Create streaming message
  const messageId = Date.now().toString();
  const streamingMessage: Message = {
    id: messageId,
    from: 'assistant',
    text: '',
    timestamp: new Date(),
    isStreaming: true
  };
  
  messages = [...messages, streamingMessage];
  
  // Read stream
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    // Update message with new chunk
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex !== -1) {
      messages[messageIndex].text += chunk;
      messages = [...messages];
    }
  }
  
  // Mark complete
  const messageIndex = messages.findIndex(m => m.id === messageId);
  if (messageIndex !== -1) {
    messages[messageIndex].isStreaming = false;
    messages = [...messages];
  }
};
```

## Browser Support

The chat UI uses Web Components and modern JavaScript features. It supports:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Troubleshooting

### Styles not appearing

Make sure you've imported the CSS file:
```js
import '@audako/chat-ui/style.css';
```

### TypeScript errors with web component

Add the component to your type definitions (see TypeScript Support section above).

### Component not registering

Ensure `registerChatWidget()` is called before the component is rendered in the DOM.
