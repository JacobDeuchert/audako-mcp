export interface ThinkingBlock {
  content: string;
  isStreaming?: boolean;
}

export interface Message {
  id: string;
  from: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: Date;
  isStreaming?: boolean;
  thinking?: ThinkingBlock; // Optional thinking/reasoning content
}

export interface StreamChunk {
  content: string;
  done?: boolean;
}

export interface ChatQuestionOption {
  label: string;
  value?: string;
  description?: string;
}

export interface ChatQuestion {
  text: string;
  options: ChatQuestionOption[];
  allowMultiple?: boolean;
}

export interface ChatRequest {
  message: string;
  conversationHistory?: Message[];
}

export interface StreamCallbacks {
  /**
   * Called for each chunk of the response content
   * @param chunk - The accumulated content so far
   */
  onChunk: (chunk: string) => void;

  /**
   * Called for each chunk of thinking/reasoning content
   * @param chunk - The accumulated thinking content so far
   */
  onThinking?: (chunk: string) => void;

  /**
   * Called when the adapter needs user input via explicit options.
   * The UI should present the question and return selected answer values.
   */
  onQuestion?: (question: ChatQuestion) => Promise<string[]>;

  /**
   * Called when streaming is complete
   */
  onComplete: () => void;

  /**
   * Called if an error occurs
   */
  onError: (error: Error) => void;
}

export interface ChatAdapter {
  /**
   * Initialize the adapter (optional)
   * Called once when the adapter is set up, before any messages are sent
   * Use this to set up connections, authenticate, or perform other setup tasks
   */
  init?(): Promise<void>;

  /**
   * Send a message and receive a streaming response
   * @param request - The chat request containing the user message
   * @param callbacks - Callbacks for handling the streaming response
   */
  sendMessage(request: ChatRequest, callbacks: StreamCallbacks): Promise<void>;

  /**
   * Cancel an ongoing request (optional)
   */
  cancel?(): void;
}

export interface ChatWidgetConfig {
  adapter: ChatAdapter;
  initialMessage?: string;
  placeholder?: string;
  title?: string;
  showThinking?: boolean;
}

export interface ChatWidgetThemeProps {
  primary?: string;
  secondary?: string;
  darkMode?: boolean;
}
