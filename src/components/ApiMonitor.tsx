import { useRuntime } from '../runtime/RuntimeContext';

function stringify(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export function ApiMonitor() {
  const { apiEvents } = useRuntime();

  return (
    <section className="panel api-monitor-panel">
      <div className="panel-title">API Request / Response Monitor</div>
      <div className="api-monitor-list">
        {apiEvents.length === 0 && <div className="console-empty">No API traffic yet. Click an action to inspect request and response data.</div>}
        {apiEvents.map((event) => (
          <article key={event.id} className={`api-event-card ${event.status}`}>
            <header className="api-event-header">
              <strong>{event.method}</strong>
              <code>{event.endpoint}</code>
              <span>{event.status}</span>
            </header>
            <div className="api-event-grid">
              <div>
                <div className="api-section-title">Request</div>
                <pre>{stringify({
                  method: event.method,
                  apiKey: event.apiKey,
                  endpoint: event.endpoint,
                  payload: event.payload,
                })}</pre>
              </div>
              <div>
                <div className="api-section-title">{event.status === 'error' ? 'Error' : 'Response'}</div>
                <pre>{stringify(event.status === 'error' ? event.error : event.response ?? { status: 'pending' })}</pre>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
