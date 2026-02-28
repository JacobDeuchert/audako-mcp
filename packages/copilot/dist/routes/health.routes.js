export async function healthRoutes(fastify, registry) {
    fastify.get('/health', handleHealth);
    async function handleHealth(_request, reply) {
        return reply.send({
            status: 'ok',
            activeSessions: registry.getActiveSessionCount(),
            timestamp: new Date().toISOString(),
        });
    }
}
//# sourceMappingURL=health.routes.js.map