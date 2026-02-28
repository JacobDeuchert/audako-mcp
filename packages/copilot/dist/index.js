import Fastify from 'fastify';
const app = Fastify();
app.listen({ port: 3000 }, (err, address) => {
    if (err)
        throw err;
    console.log(`Copilot server listening on ${address}`);
});
//# sourceMappingURL=index.js.map