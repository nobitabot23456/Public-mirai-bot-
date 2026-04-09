// src/core/Logger.ts

/**
 * Simple structured logger that outputs JSON lines.
 * Allows easy filtering in log aggregation tools.
 */

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  ts: string;
  level: string;
  module: string;
  msg: string;
  data?: Record<string, any>;
}

export class Logger {
  private level: LogLevel;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;
  }

  private write(entry: LogEntry) {
    console.log(JSON.stringify(entry));
  }

  private shouldLog(entryLevel: LogLevel): boolean {
    return entryLevel >= this.level;
  }

  debug(module: string, msg: string, data?: Record<string, any>) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.write({ ts: new Date().toISOString(), level: "DEBUG", module, msg, data });
    }
  }

  info(module: string, msg: string, data?: Record<string, any>) {
    if (this.shouldLog(LogLevel.INFO)) {
      this.write({ ts: new Date().toISOString(), level: "INFO", module, msg, data });
    }
  }

  warn(module: string, msg: string, data?: Record<string, any>) {
    if (this.shouldLog(LogLevel.WARN)) {
      this.write({ ts: new Date().toISOString(), level: "WARN", module, msg, data });
    }
  }

  error(module: string, msg: string, data?: Record<string, any>) {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.write({ ts: new Date().toISOString(), level: "ERROR", module, msg, data });
    }
  }
}

// Export a singleton logger instance – level can be controlled via env var
const envLevel = process.env.LOG_LEVEL?.toUpperCase();
let level: LogLevel;
switch (envLevel) {
  case "DEBUG":
    level = LogLevel.DEBUG;
    break;
  case "WARN":
    level = LogLevel.WARN;
    break;
  case "ERROR":
    level = LogLevel.ERROR;
    break;
  default:
    level = LogLevel.INFO;
}

export const logger = new Logger(level);
