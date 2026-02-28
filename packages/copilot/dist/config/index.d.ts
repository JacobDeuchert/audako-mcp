import { pino } from 'pino';
/** Root pino logger – every module should derive a child from this. */
export declare const rootLogger: import("pino").Logger<never>;
/** Create a named child logger that inherits the root log level. */
export declare function createLogger(name: string): pino.Logger<never>;
export declare const appConfig: {
    port: number;
    host: string;
    cors: {
        origins: string[];
    };
    session: {
        idleTimeout: number;
    };
    llm: {
        provider: string;
        modelName: string;
    };
    mutation: {
        delayMs: number;
    };
    request: {
        timeoutMs: number;
    };
    logLevel: string;
};
/**
 * Load the system prompt for the OpenCode agent from .opencode/prompts/scada-agent.md
 * @returns Promise resolving to the system prompt text
 * @throws Error if the file cannot be read
 */
export declare function loadSystemPrompt(): Promise<string>;
//# sourceMappingURL=index.d.ts.map