import type { FastifyInstance } from 'fastify';
import type { HealthResponse } from '../types/index.js';
import type { ServerRegistry } from '../services/server-registry.js';
import type { PortAllocator } from '../services/port-allocator.js';

export async function healthRoutes(
  fastify: FastifyInstance,
  registry: ServerRegistry,
  portAllocator: PortAllocator,
  maxServers: number
) {
  fastify.get<{ Reply: HealthResponse }>('/health', async (_request, reply) => {
    const health: HealthResponse = {
      status: 'ok',
      activeServers: registry.getActiveServerCount(),
      maxServers: maxServers,
      availablePorts: portAllocator.getAvailableCount(),
    };

    return reply.send(health);
  });
}
