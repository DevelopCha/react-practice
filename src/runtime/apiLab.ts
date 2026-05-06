export type ApiLabOverride = {
  requestText: string;
  responseText: string;
  statusText: string;
  messageText: string;
};

const defaultOverride: ApiLabOverride = {
  requestText: '',
  responseText: '',
  statusText: '200',
  messageText: '',
};

let overrides: Record<string, ApiLabOverride> = {};

function notifyApiLabChanged() {
  if (typeof window !== 'undefined') {
    globalThis.setTimeout(() => {
      window.dispatchEvent(new Event('runtime-api-lab-changed'));
    }, 0);
  }
}

export function getApiLabOverride(apiKey: string): ApiLabOverride {
  return overrides[apiKey] ?? defaultOverride;
}

export function setApiLabOverride(apiKey: string, override: ApiLabOverride) {
  overrides = {
    ...overrides,
    [apiKey]: override,
  };
  notifyApiLabChanged();
}

export function clearApiLabOverride(apiKey: string) {
  const nextOverrides = { ...overrides };
  delete nextOverrides[apiKey];
  overrides = nextOverrides;
  notifyApiLabChanged();
}

export function parseApiLabJson(text: string): unknown | undefined {
  if (!text.trim()) {
    return undefined;
  }

  return JSON.parse(text);
}

export function getApiLabRequestPayload<TPayload>(apiKey: string, fallback: TPayload): TPayload {
  const override = getApiLabOverride(apiKey);

  if (!override.requestText.trim()) {
    return fallback;
  }

  return parseApiLabJson(override.requestText) as TPayload;
}

export function getApiLabResponseData<TData>(apiKey: string, fallback: TData): TData {
  const override = getApiLabOverride(apiKey);

  if (!override.responseText.trim()) {
    return fallback;
  }

  return parseApiLabJson(override.responseText) as TData;
}

export function getApiLabStatus(apiKey: string): number | null {
  const status = Number(getApiLabOverride(apiKey).statusText);
  return Number.isFinite(status) ? status : null;
}

export function getApiLabMessage(apiKey: string): string | null {
  const message = getApiLabOverride(apiKey).messageText.trim();
  return message || null;
}
