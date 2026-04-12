import type { AudakoServices } from '../services/audako-services.js';
import type { SessionContext, SessionDynamicFields } from '../services/session-context.js';
import { BaseSession, type BaseSessionConfig } from './base-session.js';

export interface InteractiveSessionConfig extends BaseSessionConfig {
  sessionContext: SessionContext;
  audakoServices: AudakoServices;
  eventBridgeUnsubscribe: () => void;
}

export class InteractiveSession extends BaseSession {
  readonly sessionContext: SessionContext;
  readonly audakoServices: AudakoServices;

  private readonly eventBridgeUnsubscribe: () => void;
  private _inFlightTurn = false;

  constructor(config: InteractiveSessionConfig) {
    super(config);
    this.sessionContext = config.sessionContext;
    this.audakoServices = config.audakoServices;
    this.eventBridgeUnsubscribe = config.eventBridgeUnsubscribe;
  }

  get inFlightTurn(): boolean {
    return this._inFlightTurn;
  }

  async promptInteractive(input: string): Promise<void> {
    this._inFlightTurn = true;
    this.sessionContext.takePromptSnapshot();

    try {
      await this.prompt(input);
    } finally {
      this._inFlightTurn = false;
    }
  }

  async updateContext(fields: SessionDynamicFields): Promise<void> {
    await this.sessionContext.update(fields);
  }

  override destroy(): void {
    this.eventBridgeUnsubscribe();
    super.destroy();
  }
}
