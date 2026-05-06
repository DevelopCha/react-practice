import { useRuntime } from '../runtime/RuntimeContext';

export function ApiActivityList() {
  const { apiEvents, selectedApiEventId, selectApiEvent } = useRuntime();

  return (
    <section className="panel api-activity-panel">
      <div className="panel-title">API Flow Steps</div>
      <div className="api-activity-list">
        {apiEvents.length === 0 && <span className="muted">No API request in this trace session.</span>}
        {apiEvents.map((event, index) => (
          <button
            key={event.id}
            type="button"
            className={event.id === selectedApiEventId ? 'api-activity-item active' : 'api-activity-item'}
            onClick={() => selectApiEvent(event.id)}
          >
            <span>[{apiEvents.length - index}]</span>
            <strong>{event.method}</strong>
            <code>{event.endpoint}</code>
            <em>{event.status}</em>
          </button>
        ))}
      </div>
    </section>
  );
}
