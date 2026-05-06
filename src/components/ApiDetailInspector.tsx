import { parseMockQuery } from '../runtime/mockQueryParser';
import { useRuntime } from '../runtime/RuntimeContext';

function stringify(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export function ApiDetailInspector() {
  const { selectedApiEvent } = useRuntime();
  const mockConfig = selectedApiEvent ? parseMockQuery()[selectedApiEvent.apiKey] ?? null : null;

  return (
    <section className="panel api-detail-panel">
      <div className="panel-title">API Detail Inspector</div>
      {!selectedApiEvent && <span className="muted">Select an API request to inspect request, response, and mock config.</span>}
      {selectedApiEvent && (
        <div className="api-detail-grid">
          <div>
            <div className="api-section-title">Request</div>
            <pre>{stringify({
              method: selectedApiEvent.method,
              apiKey: selectedApiEvent.apiKey,
              endpoint: selectedApiEvent.endpoint,
              payload: selectedApiEvent.payload,
            })}</pre>
          </div>
          <div>
            <div className="api-section-title">Response</div>
            <pre>{stringify(selectedApiEvent.status === 'error' ? selectedApiEvent.error : selectedApiEvent.response ?? { status: 'pending' })}</pre>
          </div>
          <div>
            <div className="api-section-title">Mock Config</div>
            <pre>{stringify(mockConfig ?? { source: 'default mock config', apiKey: selectedApiEvent.apiKey })}</pre>
          </div>
        </div>
      )}
    </section>
  );
}
