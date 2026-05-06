export type ApiMethod = 'GET' | 'POST' | 'DELETE';

export type ApiMonitorStatus = 'pending' | 'success' | 'error';

export type ApiMonitorEntry = {
  id: number;
  method: ApiMethod;
  apiKey: string;
  endpoint: string;
  payload: unknown;
  status: ApiMonitorStatus;
  response?: unknown;
  error?: unknown;
  startedAt: string;
  completedAt?: string;
};

let nextApiEventId = 1;
let apiEvents: ApiMonitorEntry[] = [];

function notifyApiMonitorChanged() {
  if (typeof window !== 'undefined') {
    globalThis.setTimeout(() => {
      window.dispatchEvent(new Event('runtime-api-monitor-changed'));
    }, 0);
  }
}

export function addApiRequest(method: ApiMethod, apiKey: string, payload?: unknown): ApiMonitorEntry {
  const entry: ApiMonitorEntry = {
    id: nextApiEventId,
    method,
    apiKey,
    endpoint: `/mock/${apiKey}`,
    payload: payload ?? null,
    status: 'pending',
    startedAt: new Date().toISOString(),
  };

  nextApiEventId += 1;
  apiEvents = [entry, ...apiEvents];
  notifyApiMonitorChanged();

  return entry;
}

export function resolveApiRequest(id: number, response: unknown) {
  apiEvents = apiEvents.map((entry) =>
    entry.id === id
      ? {
          ...entry,
          status: 'success',
          response,
          completedAt: new Date().toISOString(),
        }
      : entry,
  );
  notifyApiMonitorChanged();
}

export function rejectApiRequest(id: number, error: unknown) {
  apiEvents = apiEvents.map((entry) =>
    entry.id === id
      ? {
          ...entry,
          status: 'error',
          error,
          completedAt: new Date().toISOString(),
        }
      : entry,
  );
  notifyApiMonitorChanged();
}

export function clearApiEvents() {
  apiEvents = [];
  nextApiEventId = 1;
  notifyApiMonitorChanged();
}

export function getApiEvents(): ApiMonitorEntry[] {
  return [...apiEvents];
}
