import type { FastifyInstance } from 'fastify';
import type { SessionEventHub } from '../services/session-event-hub.js';
import type { SessionRegistry } from '../services/session-registry.js';
import type { SessionRequestHub } from '../services/session-request-hub.js';
export declare function sessionRoutes(fastify: FastifyInstance, registry: SessionRegistry, eventHub: SessionEventHub, requestHub: SessionRequestHub): Promise<void>;
//# sourceMappingURL=session.routes.d.ts.map