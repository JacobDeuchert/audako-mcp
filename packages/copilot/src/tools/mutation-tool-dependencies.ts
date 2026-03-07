import type { AudakoServices } from '../services/audako-services.js';
import type { MutationThrottle } from '../services/mutation-throttle.js';
import type { PermissionService } from '../services/permission-service.js';
import type { SessionContext } from '../services/session-context.js';
import type { SessionEventHub } from '../services/session-event-hub.js';

export interface MutationToolDependencies {
  sessionId: string;
  sessionContext: SessionContext;
  audakoServices: AudakoServices;
  mutationThrottle: MutationThrottle;
  permissionService: PermissionService;
  eventHub: SessionEventHub;
}
