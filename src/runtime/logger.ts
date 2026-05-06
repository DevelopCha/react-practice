import type { LogKind } from '../types/runtime';

export type RuntimeLogType = LogKind;

export type RuntimeLoggerEntry = {
  id: number;
  type: RuntimeLogType;
  message: string;
  timestamp: string;
};

let nextLogId = 1;
let logs: RuntimeLoggerEntry[] = [];

function notifyLoggerChanged() {
  if (typeof window !== 'undefined') {
    globalThis.setTimeout(() => {
      window.dispatchEvent(new Event('runtime-logger-changed'));
    }, 0);
  }
}

export function addLog(type: RuntimeLogType, message: string): RuntimeLoggerEntry {
  const entry: RuntimeLoggerEntry = {
    id: nextLogId,
    type,
    message,
    timestamp: new Date().toISOString(),
  };

  nextLogId += 1;
  logs = [...logs, entry];
  notifyLoggerChanged();

  return entry;
}

export function clearLogs() {
  logs = [];
  nextLogId = 1;
  notifyLoggerChanged();
}

export function getLogs(): RuntimeLoggerEntry[] {
  return [...logs];
}
