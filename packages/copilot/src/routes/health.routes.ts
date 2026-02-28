import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { SessionRegistry } from '../services/session-registry.js';

interface HealthResponse {
  status: 'ok';
  activeSessions: number;
  timestamp: string;
}

export async function healthRoutes(fastify: FastifyInstance, registry: SessionRegistry) {
  fastify.get<{ Reply: HealthResponse }>('/health', handleHealth);

  async function handleHealth(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send({
      status: 'ok' as const,
      activeSessions: registry.getActiveSessionCount(),
      timestamp: new Date().toISOString(),
    });
  }
}
