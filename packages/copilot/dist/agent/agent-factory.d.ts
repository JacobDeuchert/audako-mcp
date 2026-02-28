import { Agent } from '@mariozechner/pi-agent-core';
import type { SessionEventHub } from '../services/session-event-hub.js';
import type { ToolRequestHub } from '../services/tool-request-hub.js';
interface SessionContextLike {
    getSessionId(): string;
    getTenantId(): string | undefined;
    getGroupId(): string | undefined;
    getEntityType(): string | undefined;
    getApp(): string | undefined;
}
interface AudakoServicesLike {
    tenantService: {
        getTenantViewById(tenantId: string): Promise<unknown>;
        getTenantViewForEntityId(entityId: string): Promise<unknown>;
    };
    entityService: {
        getPartialEntityById<T>(entityType: string, id: string, queryParameters: Record<string, unknown>): Promise<T>;
        queryConfiguration(entityType: string, filter: Record<string, unknown>): Promise<unknown>;
    };
    entityData: {
        create(entityType: string, payload: Record<string, unknown>): Promise<Record<string, unknown>>;
        update(entityType: string, entityId: string, changes: Record<string, unknown>): Promise<Record<string, unknown>>;
    };
    group: {
        moveEntity(entityType: string, entityId: string, targetGroupId: string): Promise<{
            fromGroupId?: string;
            toGroupId?: string;
        }>;
    };
}
interface ModelConfig {
    provider: string;
    modelName: string;
}
export interface CreateSessionAgentConfig {
    sessionContext: SessionContextLike;
    audakoServices: AudakoServicesLike;
    eventHub: SessionEventHub;
    requestHub: ToolRequestHub;
    systemPrompt: string;
    modelConfig: ModelConfig;
}
export interface SessionAgentFactoryResult {
    agent: Agent;
    destroy: () => void;
}
export declare function createSessionAgent(config: CreateSessionAgentConfig): SessionAgentFactoryResult;
export {};
//# sourceMappingURL=agent-factory.d.ts.map