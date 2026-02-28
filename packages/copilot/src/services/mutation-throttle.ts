const DEFAULT_MUTATION_DELAY_MS = 150;

function sleep(delayMs: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, delayMs);
  });
}

export function resolveMutationDelayMs(env: NodeJS.ProcessEnv = process.env): number {
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

export interface MutationThrottle {
  run<T>(handler: () => Promise<T> | T): Promise<T>;
}

export function createMutationThrottle(delayMs = resolveMutationDelayMs()): MutationThrottle {
  let mutationQueue: Promise<void> = Promise.resolve();

  return {
    async run<T>(handler: () => Promise<T> | T): Promise<T> {
      let releaseQueue: () => void = () => {};
      const previousOperation = mutationQueue;
      mutationQueue = new Promise<void>(resolve => {
        releaseQueue = resolve;
      });

      await previousOperation;

      try {
        if (delayMs > 0) {
          await sleep(delayMs);
        }

        return await handler();
      } finally {
        releaseQueue();
      }
    },
  };
}
