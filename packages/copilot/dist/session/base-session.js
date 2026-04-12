import { isAssistantMessage } from './message-utils.js';
export class BaseSession {
    sessionId;
    agent;
    destroyAgent;
    _destroyed = false;
    constructor(config) {
        this.sessionId = config.sessionId;
        this.agent = config.agent;
        this.destroyAgent = config.destroyAgent;
    }
    async prompt(input) {
        let finalText = '';
        const unsubscribe = this.agent.subscribe((event) => {
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
        }
        finally {
            unsubscribe();
        }
    }
    abort() {
        this.agent.abort();
    }
    destroy() {
        if (this._destroyed) {
            return;
        }
        this._destroyed = true;
        this.destroyAgent();
    }
}
//# sourceMappingURL=base-session.js.map