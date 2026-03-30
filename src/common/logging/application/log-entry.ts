export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogMeta {
  [key: string]: unknown;
}

export interface LogEntry {
  message: string;
  context?: string;
  module?: string;
  action?: string;
  entityType?: string;
  entityId?: string | number;
  requestId?: string;
  userId?: string;
  meta?: LogMeta;
}