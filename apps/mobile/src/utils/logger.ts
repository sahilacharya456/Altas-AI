/**
 * Centralized logger for AltasAI mobile.
 * In development: logs to console with structured output.
 * In production: logs are suppressed (swap console calls for Sentry/Datadog).
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
}

function formatMessage(entry: LogEntry): string {
  const prefix = `[AltasAI:${entry.context ?? 'App'}]`;
  return `${prefix} ${entry.message}`;
}

const log = (entry: LogEntry): void => {
  if (!__DEV__) return; // In production, replace with Sentry/Datadog
  const msg = formatMessage(entry);
  switch (entry.level) {
    case 'debug':
      console.debug(msg, entry.data ?? '');
      break;
    case 'info':
      console.info(msg, entry.data ?? '');
      break;
    case 'warn':
      console.warn(msg, entry.data ?? '');
      break;
    case 'error':
      console.error(msg, entry.data ?? '');
      break;
  }
};

export const logger = {
  debug: (message: string, data?: unknown, context?: string): void =>
    log({ level: 'debug', message, data, context }),
  info: (message: string, data?: unknown, context?: string): void =>
    log({ level: 'info', message, data, context }),
  warn: (message: string, data?: unknown, context?: string): void =>
    log({ level: 'warn', message, data, context }),
  error: (message: string, data?: unknown, context?: string): void =>
    log({ level: 'error', message, data, context }),
};
