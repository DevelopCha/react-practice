import { parseMockQuery } from '../runtime/mockQueryParser';
import { useRuntime } from '../runtime/RuntimeContext';

function stringify(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export function ApiDetailInspector() {
  const { selectedApiEvent } = useRuntime();
  const mockConfig = selectedApiEvent ? parseMockQuery()[selectedApiEvent.apiKey] ?? null : null;
  const response = selectedApiEvent?.status === 'error' ? selectedApiEvent.error : selectedApiEvent?.response ?? { status: 'pending' };
  const transformedResponse = selectedApiEvent?.status === 'success' ? selectedApiEvent.response : null;

  return (
    <section className="panel api-detail-panel">
      <div className="panel-title">API Data Flow</div>
      {!selectedApiEvent && <span className="muted">Select an API request to inspect request, response, transformation, and reducer payload.</span>}
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
            <div className="api-section-title">Mock Normalized Payload</div>
            <pre>{stringify({
              apiKey: selectedApiEvent.apiKey,
              mockConfig: mockConfig ?? 'default',
              requestPayload: selectedApiEvent.payload,
            })}</pre>
          </div>
          <div>
            <div className="api-section-title">Raw Response</div>
            <pre>{stringify(response)}</pre>
          </div>
          <div>
            <div className="api-section-title">Reducer Payload</div>
            <pre>{stringify({
              status: selectedApiEvent.status,
              payload: transformedResponse,
              error: selectedApiEvent.status === 'error' ? selectedApiEvent.error : null,
            })}</pre>
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
