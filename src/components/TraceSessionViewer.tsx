import { useRuntime } from '../runtime/RuntimeContext';

export function TraceSessionViewer() {
  const { traceSession, flowSteps, activeStepId } = useRuntime();

  return (
    <section className="panel trace-session-panel">
      <div className="panel-title">Trace Session Viewer</div>
      <div className="trace-session-meta">
        {traceSession ? (
          <>
            <strong>Trace #{traceSession.id}</strong>
            <span>{traceSession.title}</span>
          </>
        ) : (
          <span className="muted">Click an action to start a focused trace session.</span>
        )}
      </div>
      <div className="trace-step-list">
        {flowSteps.map((step, index) => (
          <div key={step.id} className={step.id === activeStepId ? 'trace-step active' : 'trace-step'}>
            <span>{index + 1}</span>
            <strong>{step.label}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
