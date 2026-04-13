import { LogEntry } from './log-entry';

export interface LoggerPort {
  debug(entry: LogEntry): void;
  info(entry: LogEntry): void;
  warn(entry: LogEntry): void;
  error(entry: LogEntry): void;
}
