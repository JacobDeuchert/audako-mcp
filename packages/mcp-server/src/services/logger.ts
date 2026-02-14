import { appendFile, mkdir } from "fs/promises";
import { isAbsolute, join } from "path";

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

class Logger {
  private static instance: Logger;
  private logFilePath: string;
  private logsDir: string;
  private minLevel: LogLevel;
  private writeQueue: Promise<void> = Promise.resolve();
  private ensureLogDirectoryPromise?: Promise<void>;

  private constructor() {
    const configuredLogDir = process.env.AUDAKO_LOG_DIR?.trim();
    this.logsDir = configuredLogDir
      ? isAbsolute(configuredLogDir)
        ? configuredLogDir
        : join(process.cwd(), configuredLogDir)
      : join(process.cwd(), "logs");

    const configuredLogFile = process.env.AUDAKO_LOG_FILE?.trim();
    const timestamp = new Date().toISOString().split("T")[0];
    this.logFilePath = join(
      this.logsDir,
      configuredLogFile && configuredLogFile.length > 0
        ? configuredLogFile
        : `audako-mcp-${timestamp}.log`,
    );

    this.minLevel = this.resolveLogLevel(process.env.AUDAKO_LOG_LEVEL);
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private resolveLogLevel(level?: string): LogLevel {
    const normalized = level?.trim().toUpperCase();
    switch (normalized) {
      case LogLevel.ERROR:
        return LogLevel.ERROR;
      case LogLevel.WARN:
        return LogLevel.WARN;
      case LogLevel.INFO:
        return LogLevel.INFO;
      case LogLevel.DEBUG:
      default:
        return LogLevel.DEBUG;
    }
  }

  private shouldWrite(level: LogLevel): boolean {
    const priorities: Record<LogLevel, number> = {
      [LogLevel.DEBUG]: 10,
      [LogLevel.INFO]: 20,
      [LogLevel.WARN]: 30,
      [LogLevel.ERROR]: 40,
    };

    return priorities[level] >= priorities[this.minLevel];
  }

  private ensureLogDirectory(): Promise<void> {
    if (!this.ensureLogDirectoryPromise) {
      this.ensureLogDirectoryPromise = mkdir(this.logsDir, {
        recursive: true,
      }).then(() => undefined);
    }

    return this.ensureLogDirectoryPromise;
  }

  private formatLogEntry(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    let metaStr = "";

    if (typeof meta !== "undefined") {
      try {
        metaStr = ` | ${JSON.stringify(meta)}`;
      } catch {
        metaStr = " | [unserializable metadata]";
      }
    }

    return `[${timestamp}] [${level}] ${message}${metaStr}\n`;
  }

  private async writeLog(
    level: LogLevel,
    message: string,
    meta?: any,
  ): Promise<void> {
    if (!this.shouldWrite(level)) {
      return;
    }

    try {
      const logEntry = this.formatLogEntry(level, message, meta);

      this.writeQueue = this.writeQueue
        .catch(() => {})
        .then(async () => {
          await this.ensureLogDirectory();
          await appendFile(this.logFilePath, logEntry, "utf-8");
        });

      await this.writeQueue;
    } catch (error) {
      // Silently fail to avoid interfering with MCP communication
      // Could write to stderr as fallback, but avoiding stdout/stderr completely
    }
  }

  public getLogFilePath(): string {
    return this.logFilePath;
  }

  public getMinLevel(): LogLevel {
    return this.minLevel;
  }

  public async debug(message: string, meta?: any): Promise<void> {
    await this.writeLog(LogLevel.DEBUG, message, meta);
  }

  public async info(message: string, meta?: any): Promise<void> {
    await this.writeLog(LogLevel.INFO, message, meta);
  }

  public async warn(message: string, meta?: any): Promise<void> {
    await this.writeLog(LogLevel.WARN, message, meta);
  }

  public async error(message: string, meta?: any): Promise<void> {
    await this.writeLog(LogLevel.ERROR, message, meta);
  }

  public async trace(
    toolName: string,
    action: string,
    meta?: any,
  ): Promise<void> {
    await this.debug(`[TRACE] ${toolName} - ${action}`, meta);
  }
}

// Export singleton instance
export const logger = Logger.getInstance();
