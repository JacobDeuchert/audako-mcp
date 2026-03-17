import type { AgentTool } from '@mariozechner/pi-agent-core';
import type { AudakoServices } from '../services/audako-services.js';
import type { MutationThrottle } from '../services/mutation-throttle.js';
import type { PermissionService } from '../services/permission-service.js';
import type { SessionContext } from '../services/session-context.js';
import type { SessionEventHub } from '../services/session-event-hub.js';
import { createCreateEntityTool } from './create-entity.js';
import { createMoveEntityTool } from './move-entity.js';
import { createUpdateEntityTool } from './update-entity.js';

export interface MutationToolDependencies {
  sessionId: string;
  sessionContext: SessionContext;
  audakoServices: AudakoServices;
  mutationThrottle: MutationThrottle;
  permissionService: PermissionService;
  eventHub: SessionEventHub;
}

export function createMutationTools(
  sessionId: string,
  sessionContext: SessionContext,
  audakoServices: AudakoServices,
  mutationThrottle: MutationThrottle,
  permissionService: PermissionService,
  eventHub: SessionEventHub,
): AgentTool<any>[] {
  return [
    createCreateEntityTool({
      sessionId,
      sessionContext,
      audakoServices,
      mutationThrottle,
      permissionService,
      eventHub,
    }),
    createUpdateEntityTool({
      sessionId,
      sessionContext,
      audakoServices,
      mutationThrottle,
      permissionService,
      eventHub,
    }),
    createMoveEntityTool({
      sessionId,
      sessionContext,
      audakoServices,
      mutationThrottle,
      permissionService,
      eventHub,
    }),
  ];
}
