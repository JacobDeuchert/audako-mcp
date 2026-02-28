export declare function resolveMutationDelayMs(env?: NodeJS.ProcessEnv): number;
export interface MutationThrottle {
    run<T>(handler: () => Promise<T> | T): Promise<T>;
}
export declare function createMutationThrottle(delayMs?: number): MutationThrottle;
//# sourceMappingURL=mutation-throttle.d.ts.map