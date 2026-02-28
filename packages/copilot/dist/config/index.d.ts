import { pino } from 'pino';
/** Root pino logger – every module should derive a child from this. */
export declare const rootLogger: import("pino").Logger<never>;
/** Create a named child logger that inherits the root log level. */
export declare function createLogger(name: string): pino.Logger<never>;
export declare const appConfig: {
    port: number;
    host: string;
    session: {
        idleTimeout: number;
    };
    llm: {
        provider: string;
        modelName: string;
    };
    logLevel: string;
};
//# sourceMappingURL=index.d.ts.map