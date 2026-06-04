export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function isLoggingEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_ENABLE_LOGS === "true") return true;
  return process.env.NODE_ENV === "development";
}

function shouldLog(level: LogLevel, minLevel: LogLevel): boolean {
  return isLoggingEnabled() && LEVEL_ORDER[level] >= LEVEL_ORDER[minLevel];
}

function formatPayload(data: unknown): unknown {
  if (data === undefined) return undefined;
  if (data instanceof Error) {
    return { message: data.message, name: data.name, stack: data.stack };
  }
  return data;
}

export type Logger = {
  debug: (message: string, data?: unknown) => void;
  info: (message: string, data?: unknown) => void;
  warn: (message: string, data?: unknown) => void;
  error: (message: string, data?: unknown) => void;
};

function write(level: LogLevel, context: string, message: string, data?: unknown) {
  const line = `[${context}] ${message}`;
  const payload = formatPayload(data);
  const args = payload === undefined ? [line] : [line, payload];

  switch (level) {
    case "debug":
      console.debug(...args);
      break;
    case "info":
      console.info(...args);
      break;
    case "warn":
      console.warn(...args);
      break;
    case "error":
      console.error(...args);
      break;
  }
}

function createLogger(context: string, minLevel: LogLevel = "debug"): Logger {
  return {
    debug: (message, data) => {
      if (shouldLog("debug", minLevel)) write("debug", context, message, data);
    },
    info: (message, data) => {
      if (shouldLog("info", minLevel)) write("info", context, message, data);
    },
    warn: (message, data) => {
      if (shouldLog("warn", minLevel)) write("warn", context, message, data);
    },
    error: (message, data) => {
      if (shouldLog("error", minLevel)) write("error", context, message, data);
    },
  };
}

export const logService = {
  createLogger,
  /** Root logger when no context namespace is needed */
  logger: createLogger("Expensio"),
};
