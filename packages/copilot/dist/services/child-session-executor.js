import { createSessionAgent } from '../agent/agent-factory.js';
import { buildSessionEvent } from './session-event-utils.js';
export class ChildSessionExecutor {
    deps;
    constructor(deps) {
        this.deps = deps;
    }
    async execute(input) {
        const parentSession = this.deps.registry.getSession(input.parentSessionId);
        if (!parentSession) {
            throw new Error(`Parent session not found: ${input.parentSessionId}`);
        }
        const runtime = this.deps.childSessionManager.createChildSession(input.parentSessionId, input.profile.name);
        this.deps.permissionService.grantDelegatedScope(input.parentSessionId, runtime.childSessionId, input.delegatedScope ?? {
            entityTypes: [],
            groupIds: [],
            grantedAt: new Date().toISOString(),
        });
        this.publishAccepted(runtime, input.description);
        const inputAbortHandler = () => {
            this.deps.childSessionManager.cancelChildSession(runtime.childSessionId);
        };
        input.abortSignal?.addEventListener('abort', inputAbortHandler);
        const childSessionContext = this.createChildSessionContext(parentSession.sessionContext, runtime);
        childSessionContext.bindServices(parentSession.audakoServices);
        const { agent, destroy } = await createSessionAgent({
            sessionContext: childSessionContext,
            audakoServices: parentSession.audakoServices,
            eventHub: this.deps.eventHub,
            requestHub: this.deps.requestHub,
            permissionService: this.deps.permissionService,
            profile: input.profile,
            requestedTools: input.requestedTools,
        });
        const childAgent = agent;
        const runtimeAbortHandler = () => {
            childAgent.abort();
        };
        runtime.abortController.signal.addEventListener('abort', runtimeAbortHandler);
        this.publishStarted(runtime);
        try {
            const resultText = await this.runChildPrompt(childAgent, input.prompt);
            if (runtime.status === 'cancelled') {
                const reason = runtime.error ?? 'cancelled';
                this.publishCancelled(runtime, reason);
                return {
                    childSessionId: runtime.childSessionId,
                    status: 'cancelled',
                    error: reason,
                };
            }
            this.deps.childSessionManager.completeChildSession(runtime.childSessionId, resultText);
            this.publishCompleted(runtime, resultText);
            return {
                childSessionId: runtime.childSessionId,
                status: 'completed',
                resultText,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (runtime.status === 'cancelled' || runtime.abortController.signal.aborted) {
                const reason = runtime.error ?? errorMessage;
                this.publishCancelled(runtime, reason);
                return {
                    childSessionId: runtime.childSessionId,
                    status: 'cancelled',
                    error: reason,
                };
            }
            this.deps.childSessionManager.failChildSession(runtime.childSessionId, error);
            this.publishFailed(runtime, errorMessage);
            return {
                childSessionId: runtime.childSessionId,
                status: 'failed',
                error: errorMessage,
            };
        }
        finally {
            this.deps.permissionService.clearDelegatedScope(runtime.childSessionId);
            runtime.abortController.signal.removeEventListener('abort', runtimeAbortHandler);
            input.abortSignal?.removeEventListener('abort', inputAbortHandler);
            destroy();
        }
    }
    createChildSessionContext(parentSessionContext, runtime) {
        const SessionContextCtor = parentSessionContext.constructor;
        return new SessionContextCtor({
            sessionId: runtime.childSessionId,
            scadaUrl: parentSessionContext.scadaUrl,
            accessToken: parentSessionContext.accessToken,
            tenantId: parentSessionContext.tenantId,
            groupId: parentSessionContext.groupId,
            entityType: parentSessionContext.entityType,
            app: parentSessionContext.app,
        });
    }
    publishAccepted(runtime, description) {
        this.deps.eventHub.publish(runtime.parentSessionId, buildSessionEvent('child_task.accepted', runtime.parentSessionId, {
            childSessionId: runtime.childSessionId,
            parentSessionId: runtime.parentSessionId,
            profileName: runtime.profileName,
            description,
            timestamp: new Date().toISOString(),
        }));
    }
    publishStarted(runtime) {
        this.deps.eventHub.publish(runtime.parentSessionId, buildSessionEvent('child_task.started', runtime.parentSessionId, {
            childSessionId: runtime.childSessionId,
            parentSessionId: runtime.parentSessionId,
            profileName: runtime.profileName,
            startedAt: new Date().toISOString(),
        }));
    }
    publishCompleted(runtime, result) {
        this.deps.eventHub.publish(runtime.parentSessionId, buildSessionEvent('child_task.completed', runtime.parentSessionId, {
            childSessionId: runtime.childSessionId,
            parentSessionId: runtime.parentSessionId,
            profileName: runtime.profileName,
            completedAt: new Date().toISOString(),
            result,
        }));
    }
    publishFailed(runtime, error) {
        this.deps.eventHub.publish(runtime.parentSessionId, buildSessionEvent('child_task.failed', runtime.parentSessionId, {
            childSessionId: runtime.childSessionId,
            parentSessionId: runtime.parentSessionId,
            profileName: runtime.profileName,
            failedAt: new Date().toISOString(),
            error,
        }));
    }
    publishCancelled(runtime, reason) {
        this.deps.eventHub.publish(runtime.parentSessionId, buildSessionEvent('child_task.cancelled', runtime.parentSessionId, {
            childSessionId: runtime.childSessionId,
            parentSessionId: runtime.parentSessionId,
            profileName: runtime.profileName,
            cancelledAt: new Date().toISOString(),
            reason,
        }));
    }
    async runChildPrompt(agent, prompt) {
        let finalText = '';
        const unsubscribe = agent.subscribe(event => {
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
            await agent.prompt(prompt);
            return finalText;
        }
        finally {
            unsubscribe();
        }
    }
}
function isAssistantMessage(message) {
    if (!message || typeof message !== 'object') {
        return false;
    }
    const candidate = message;
    return (candidate.role === 'assistant' &&
        Array.isArray(candidate.content) &&
        typeof candidate.stopReason === 'string');
}
//# sourceMappingURL=child-session-executor.js.map