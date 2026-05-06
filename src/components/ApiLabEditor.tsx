import { useEffect, useState } from 'react';
import {
  clearApiLabOverride,
  getApiLabOverride,
  setApiLabOverride,
  type ApiLabOverride,
} from '../runtime/apiLab';

type ApiLabEditorProps = {
  apiKeys: string[];
};

function formatJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

const presets: Record<string, { request?: unknown; response?: unknown; message: string }> = {
  auth: {
    response: { id: 'admin', name: 'Legacy Admin' },
    message: 'session restored',
  },
  login: {
    request: { id: 'admin', password: '1234' },
    response: { id: 'admin', name: 'admin User' },
    message: 'login success',
  },
  users: {
    response: [
      { id: 1, title: 'Runtime trace note', body: 'API data enters reducer state.' },
      { id: 2, title: 'Reducer checkpoint', body: 'State diff explains what changed.' },
    ],
    message: 'list fetch success',
  },
  write: {
    request: { title: 'Reducer action note', body: 'Mutation requests update Context through dispatch.' },
    response: { id: 1001, title: 'Edited response title', body: 'This response came from API Lab.' },
    message: 'create success',
  },
  delete: {
    request: { deletedId: 1 },
    response: { deletedId: 1 },
    message: 'delete success',
  },
  logout: {
    response: null,
    message: 'logout success',
  },
};

export function ApiLabEditor({ apiKeys }: ApiLabEditorProps) {
  const [selectedApiKey, setSelectedApiKey] = useState(apiKeys[0] ?? '');
  const [override, setOverride] = useState<ApiLabOverride>(() => getApiLabOverride(apiKeys[0] ?? ''));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiKeys.includes(selectedApiKey)) {
      const nextApiKey = apiKeys[0] ?? '';
      setSelectedApiKey(nextApiKey);
      setOverride(getApiLabOverride(nextApiKey));
    }
  }, [apiKeys, selectedApiKey]);

  useEffect(() => {
    setOverride(getApiLabOverride(selectedApiKey));
    setError(null);
  }, [selectedApiKey]);

  if (apiKeys.length === 0) {
    return null;
  }

  const update = (nextOverride: ApiLabOverride) => {
    setOverride(nextOverride);
    setApiLabOverride(selectedApiKey, nextOverride);
  };

  const applyPreset = () => {
    const preset = presets[selectedApiKey];
    const nextOverride = {
      requestText: preset?.request === undefined ? '' : formatJson(preset.request),
      responseText: preset?.response === undefined ? '' : formatJson(preset.response),
      statusText: '200',
      messageText: preset?.message ?? '',
    };

    update(nextOverride);
    setError(null);
  };

  const validateJson = () => {
    try {
      if (override.requestText.trim()) {
        JSON.parse(override.requestText);
      }
      if (override.responseText.trim()) {
        JSON.parse(override.responseText);
      }
      setError(null);
    } catch (jsonError) {
      setError(jsonError instanceof Error ? jsonError.message : 'Invalid JSON');
    }
  };

  const reset = () => {
    clearApiLabOverride(selectedApiKey);
    setOverride(getApiLabOverride(selectedApiKey));
    setError(null);
  };

  return (
    <section className="api-lab-editor">
      <div className="api-lab-header">
        <strong>API Lab</strong>
        <select value={selectedApiKey} onChange={(event) => setSelectedApiKey(event.target.value)}>
          {apiKeys.map((apiKey) => (
            <option key={apiKey} value={apiKey}>
              {apiKey}
            </option>
          ))}
        </select>
      </div>
      <div className="api-lab-row">
        <label>
          Status
          <input
            value={override.statusText}
            onChange={(event) => update({ ...override, statusText: event.target.value })}
          />
        </label>
        <label>
          Message
          <input
            value={override.messageText}
            onChange={(event) => update({ ...override, messageText: event.target.value })}
          />
        </label>
      </div>
      <label>
        Request JSON
        <textarea
          spellCheck={false}
          value={override.requestText}
          onBlur={validateJson}
          onChange={(event) => update({ ...override, requestText: event.target.value })}
          placeholder='{"id":"admin","password":"1234"}'
        />
      </label>
      <label>
        Response JSON
        <textarea
          spellCheck={false}
          value={override.responseText}
          onBlur={validateJson}
          onChange={(event) => update({ ...override, responseText: event.target.value })}
          placeholder='{"id":"admin","name":"Legacy Admin"}'
        />
      </label>
      <div className="button-row">
        <button type="button" onClick={applyPreset}>
          Fill sample
        </button>
        <button type="button" className="secondary-button" onClick={reset}>
          Reset
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}
    </section>
  );
}
