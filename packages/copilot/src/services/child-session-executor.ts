import { createSessionAgent } from '../agent/agent-factory.js';
import type { AgentProfile } from '../agent/profiles.js';
import { BaseSession } from '../session/base-session.js';
import type { ChildSessionManager, ChildSessionRuntime } from './child-session-runtime.js';
import type { DelegatedScope, PermissionService } from './permission-service.js';
import type { SessionEventHub } from './session-event-hub.js';
import { buildSessionEvent } from './session-event-utils.js';
import type { SessionRegistry } from './session-registry.js';
import type { SessionTodoStore } from './session-todo-store.js';
import type { ToolRequestHub } from './tool-request-hub.js';

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
  sessionTodoStore: SessionTodoStore;
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

    this.publishChildEvent(runtime, 'accepted', {
      description: input.description,
      timestamp: new Date().toISOString(),
    });

    const inputAbortHandler = () => {
      this.deps.childSessionManager.cancelChildSession(runtime.childSessionId);
    };

    input.abortSignal?.addEventListener('abort', inputAbortHandler);

    const { agent, destroy } = await createSessionAgent({
      sessionContext: parentSession.session.sessionContext,
      audakoServices: parentSession.session.audakoServices,
      eventHub: this.deps.eventHub,
      requestHub: this.deps.requestHub,
      permissionService: this.deps.permissionService,
      sessionTodoStore: this.deps.sessionTodoStore,
      profile: input.profile,
      requestedTools: input.requestedTools,
    });

    const childSession = new BaseSession({
      sessionId: runtime.childSessionId,
      agent,
      destroyAgent: destroy,
    });

    const runtimeAbortHandler = () => {
      childSession.abort();
    };
    runtime.abortController.signal.addEventListener('abort', runtimeAbortHandler);

    this.publishChildEvent(runtime, 'started', { startedAt: new Date().toISOString() });

    try {
      const resultText = await childSession.prompt(input.prompt);

      if (runtime.status === 'cancelled') {
        const reason = runtime.error ?? 'cancelled';
        this.publishChildEvent(runtime, 'cancelled', {
          cancelledAt: new Date().toISOString(),
          reason,
        });
        return {
          childSessionId: runtime.childSessionId,
          status: 'cancelled',
          error: reason,
        };
      }

      this.deps.childSessionManager.completeChildSession(runtime.childSessionId, resultText);
      this.publishChildEvent(runtime, 'completed', {
        completedAt: new Date().toISOString(),
        result: resultText,
      });

      return {
        childSessionId: runtime.childSessionId,
        status: 'completed',
        resultText,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (runtime.status === 'cancelled' || runtime.abortController.signal.aborted) {
        const reason = runtime.error ?? errorMessage;
        this.publishChildEvent(runtime, 'cancelled', {
          cancelledAt: new Date().toISOString(),
          reason,
        });
        return {
          childSessionId: runtime.childSessionId,
          status: 'cancelled',
          error: reason,
        };
      }

      this.deps.childSessionManager.failChildSession(runtime.childSessionId, error);
      this.publishChildEvent(runtime, 'failed', {
        failedAt: new Date().toISOString(),
        error: errorMessage,
      });

      return {
        childSessionId: runtime.childSessionId,
        status: 'failed',
        error: errorMessage,
      };
    } finally {
      this.deps.permissionService.clearDelegatedScope(runtime.childSessionId);
      runtime.abortController.signal.removeEventListener('abort', runtimeAbortHandler);
      input.abortSignal?.removeEventListener('abort', inputAbortHandler);
      childSession.destroy();
    }
  }

  private publishChildEvent(
    runtime: ChildSessionRuntime,
    event: 'accepted' | 'started' | 'completed' | 'failed' | 'cancelled',
    extra: Record<string, unknown> = {},
  ): void {
    this.deps.eventHub.publish(
      runtime.parentSessionId,
      buildSessionEvent(`child_task.${event}`, runtime.parentSessionId, {
        childSessionId: runtime.childSessionId,
        parentSessionId: runtime.parentSessionId,
        profileName: runtime.profileName,
        ...extra,
      }),
    );
  }
}
