import type { AgentEvent } from '@mariozechner/pi-agent-core';
import { createSessionAgent } from '../agent/agent-factory.js';
import type { AgentProfile } from '../agent/profiles.js';
import type { ChildSessionManager, ChildSessionRuntime } from './child-session-runtime.js';
import type { DelegatedScope, PermissionService } from './permission-service.js';
import type { SessionContext } from './session-context.js';
import type { SessionEventHub } from './session-event-hub.js';
import { buildSessionEvent } from './session-event-utils.js';
import type { SessionRegistry } from './session-registry.js';
import type { ToolRequestHub } from './tool-request-hub.js';

interface ChildAgent {
  prompt: (input: string) => Promise<unknown>;
  subscribe: (listener: (event: AgentEvent) => void) => () => void;
  abort: () => void;
}

export interface ExecuteChildSessionInput {
  parentSessionId: string;
  description: string;
  prompt: string;
  profile: AgentProfile;
  requestedTools?: readonly string[];
  delegatedScope?: DelegatedScope;
  abortSignal?: AbortSignal;
}

export interface ExecuteChildSessionResult {
  childSessionId: string;
  status: 'completed' | 'failed' | 'cancelled';
  resultText?: string;
  error?: string;
}

interface ChildSessionExecutorDependencies {
  registry: SessionRegistry;
  eventHub: SessionEventHub;
  childSessionManager: ChildSessionManager;
  requestHub: ToolRequestHub;
  permissionService: PermissionService;
}

export class ChildSessionExecutor {
  constructor(private readonly deps: ChildSessionExecutorDependencies) {}

  async execute(input: ExecuteChildSessionInput): Promise<ExecuteChildSessionResult> {
    const parentSession = this.deps.registry.getSession(input.parentSessionId);
    if (!parentSession) {
      throw new Error(`Parent session not found: ${input.parentSessionId}`);
    }

    const runtime = this.deps.childSessionManager.createChildSession(
      input.parentSessionId,
      input.profile.name,
    );

    this.deps.permissionService.grantDelegatedScope(
      input.parentSessionId,
      runtime.childSessionId,
      input.delegatedScope ?? {
        entityTypes: [],
        groupIds: [],
        grantedAt: new Date().toISOString(),
      },
    );

    this.publishAccepted(runtime, input.description);

    const inputAbortHandler = () => {
      this.deps.childSessionManager.cancelChildSession(runtime.childSessionId);
    };

    input.abortSignal?.addEventListener('abort', inputAbortHandler);

    const childSessionContext = this.createChildSessionContext(
      parentSession.sessionContext,
      runtime,
    );
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

    const childAgent = agent as unknown as ChildAgent;
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
    } catch (error) {
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
    } finally {
      this.deps.permissionService.clearDelegatedScope(runtime.childSessionId);
      runtime.abortController.signal.removeEventListener('abort', runtimeAbortHandler);
      input.abortSignal?.removeEventListener('abort', inputAbortHandler);
      destroy();
    }
  }

  private createChildSessionContext(
    parentSessionContext: SessionContext,
    runtime: ChildSessionRuntime,
  ): SessionContext {
    const SessionContextCtor = parentSessionContext.constructor as typeof SessionContext;

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

  private publishAccepted(runtime: ChildSessionRuntime, description: string): void {
    this.deps.eventHub.publish(
      runtime.parentSessionId,
      buildSessionEvent('child_task.accepted', runtime.parentSessionId, {
        childSessionId: runtime.childSessionId,
        parentSessionId: runtime.parentSessionId,
        profileName: runtime.profileName,
        description,
        timestamp: new Date().toISOString(),
      }),
    );
  }

  private publishStarted(runtime: ChildSessionRuntime): void {
    this.deps.eventHub.publish(
      runtime.parentSessionId,
      buildSessionEvent('child_task.started', runtime.parentSessionId, {
        childSessionId: runtime.childSessionId,
        parentSessionId: runtime.parentSessionId,
        profileName: runtime.profileName,
        startedAt: new Date().toISOString(),
      }),
    );
  }

  private publishCompleted(runtime: ChildSessionRuntime, result: unknown): void {
    this.deps.eventHub.publish(
      runtime.parentSessionId,
      buildSessionEvent('child_task.completed', runtime.parentSessionId, {
        childSessionId: runtime.childSessionId,
        parentSessionId: runtime.parentSessionId,
        profileName: runtime.profileName,
        completedAt: new Date().toISOString(),
        result,
      }),
    );
  }

  private publishFailed(runtime: ChildSessionRuntime, error: string): void {
    this.deps.eventHub.publish(
      runtime.parentSessionId,
      buildSessionEvent('child_task.failed', runtime.parentSessionId, {
        childSessionId: runtime.childSessionId,
        parentSessionId: runtime.parentSessionId,
        profileName: runtime.profileName,
        failedAt: new Date().toISOString(),
        error,
      }),
    );
  }

  private publishCancelled(runtime: ChildSessionRuntime, reason: string): void {
    this.deps.eventHub.publish(
      runtime.parentSessionId,
      buildSessionEvent('child_task.cancelled', runtime.parentSessionId, {
        childSessionId: runtime.childSessionId,
        parentSessionId: runtime.parentSessionId,
        profileName: runtime.profileName,
        cancelledAt: new Date().toISOString(),
        reason,
      }),
    );
  }

  private async runChildPrompt(agent: ChildAgent, prompt: string): Promise<string> {
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
    } finally {
      unsubscribe();
    }
  }
}

function isAssistantMessage(message: unknown): message is {
  role: 'assistant';
  content: Array<{ type: string; text: string }>;
  stopReason: string;
} {
  if (!message || typeof message !== 'object') {
    return false;
  }

  const candidate = message as {
    role?: unknown;
    content?: unknown;
    stopReason?: unknown;
  };

  return (
    candidate.role === 'assistant' &&
    Array.isArray(candidate.content) &&
    typeof candidate.stopReason === 'string'
  );
}
