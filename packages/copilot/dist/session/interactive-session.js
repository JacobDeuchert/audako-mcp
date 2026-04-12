import { BaseSession } from './base-session.js';
export class InteractiveSession extends BaseSession {
    sessionContext;
    audakoServices;
    eventBridgeUnsubscribe;
    _inFlightTurn = false;
    constructor(config) {
        super(config);
        this.sessionContext = config.sessionContext;
        this.audakoServices = config.audakoServices;
        this.eventBridgeUnsubscribe = config.eventBridgeUnsubscribe;
    }
    get inFlightTurn() {
        return this._inFlightTurn;
    }
    async promptInteractive(input) {
        this._inFlightTurn = true;
        this.sessionContext.takePromptSnapshot();
        try {
            await this.prompt(input);
        }
        finally {
            this._inFlightTurn = false;
        }
    }
    async updateContext(fields) {
        await this.sessionContext.update(fields);
    }
    destroy() {
        this.eventBridgeUnsubscribe();
        super.destroy();
    }
}
//# sourceMappingURL=interactive-session.js.map