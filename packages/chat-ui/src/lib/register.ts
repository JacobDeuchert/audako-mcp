import ChatWidget from './ChatWidget.svelte';
import './styles.css';
import type { ChatWidgetConfig } from './types';

export { ChatWidget };
export type { ChatAdapter, ChatRequest, ChatWidgetConfig, Message, StreamCallbacks, ThinkingBlock } from './types';
export { MockAdapter } from './adapters/mock-adapter';
export { OpenAIAdapter } from './adapters/openai-adapter';
export type { OpenAIAdapterConfig } from './adapters/openai-adapter';
export { OpenCodeAdapter } from './adapters/opencode-adapter';
export type { OpenCodeAdapterConfig } from './adapters/opencode-adapter';

/**
 * Register the chat widget as a custom element
 * @param config - Configuration for the chat widget including the LLM adapter
 * @param tag - Custom element tag name (default: 'audako-chat')
 * @returns The tag name used for registration
 */
export function registerChatWidget(config?: ChatWidgetConfig, tag = 'audako-chat') {
  // Store config globally so the web component can access it
  if (config) {
    (window as any).__audakoChatConfig = config;
  }

  if (!customElements.get(tag)) {
    customElements.define(tag, ChatWidget as unknown as CustomElementConstructor);
  }

  return tag;
}

/**
 * Get a reference to a chat widget element and set its configuration
 * @param element - The chat widget element or selector
 * @param config - Configuration to apply
 */
export function configureChatWidget(
  element: HTMLElement | string,
  config: ChatWidgetConfig
): void {
  const el = typeof element === 'string' 
    ? document.querySelector(element) 
    : element;
    
  if (!el) {
    throw new Error('Chat widget element not found');
  }

  // Call the setConfig method on the web component
  if ('setConfig' in el && typeof el.setConfig === 'function') {
    (el as any).setConfig(config);
  }
}
