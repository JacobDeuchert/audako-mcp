const DEFAULT_MUTATION_DELAY_MS = 150;
function sleep(delayMs) {
    return new Promise(resolve => {
        setTimeout(resolve, delayMs);
    });
}
export function resolveMutationDelayMs(env = process.env) {
    const configuredDelay = env.AUDAKO_MUTATION_DELAY_MS?.trim();
    if (!configuredDelay) {
        return DEFAULT_MUTATION_DELAY_MS;
    }
    const parsedDelay = Number(configuredDelay);
    if (!Number.isFinite(parsedDelay) || parsedDelay < 0) {
        return DEFAULT_MUTATION_DELAY_MS;
    }
    return Math.floor(parsedDelay);
}
export function createMutationThrottle(delayMs = resolveMutationDelayMs()) {
    let mutationQueue = Promise.resolve();
    return {
        async run(handler) {
            let releaseQueue = () => { };
            const previousOperation = mutationQueue;
            mutationQueue = new Promise(resolve => {
                releaseQueue = resolve;
            });
            await previousOperation;
            try {
                if (delayMs > 0) {
                    await sleep(delayMs);
                }
                return await handler();
            }
            finally {
                releaseQueue();
            }
        },
    };
}
//# sourceMappingURL=mutation-throttle.js.map