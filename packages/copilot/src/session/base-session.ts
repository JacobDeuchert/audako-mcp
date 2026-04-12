import type { Agent, AgentEvent } from '@mariozechner/pi-agent-core';
import { isAssistantMessage } from './message-utils.js';

export interface BaseSessionConfig {
  sessionId: string;
  agent: Agent;
  destroyAgent: () => void;
}

export class BaseSession {
  readonly sessionId: string;

  protected readonly agent: Agent;
  private readonly destroyAgent: () => void;
  private _destroyed = false;

  constructor(config: BaseSessionConfig) {
    this.sessionId = config.sessionId;
    this.agent = config.agent;
    this.destroyAgent = config.destroyAgent;
  }

  async prompt(input: string): Promise<string> {
    let finalText = '';

    const unsubscribe = this.agent.subscribe((event: AgentEvent) => {
      if (event.type !== 'turn_end') {
        return;
      }

      if (!isAssistantMessage(event.message) || event.message.stopReason === 'toolUse') {
        return;
      }

      finalText = event.message.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('')
        .trim();
    });

    try {
      await this.agent.prompt(input);
      return finalText;
    } finally {
      unsubscribe();
    }
  }

  abort(): void {
    this.agent.abort();
  }

  destroy(): void {
    if (this._destroyed) {
      return;
    }
    this._destroyed = true;
    this.destroyAgent();
  }
}
