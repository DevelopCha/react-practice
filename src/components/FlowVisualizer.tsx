import { useRuntime } from '../runtime/RuntimeContext';

export function FlowVisualizer() {
  const { flowSteps, activeStepId } = useRuntime();

  return (
    <section className="panel flow-panel">
      <div className="panel-title">Runtime Flow Monitor</div>
      <div className="flow-step-monitor" aria-label="Runtime flow monitor">
        {flowSteps.map((step) => (
          <div key={step.id} className={step.id === activeStepId ? 'flow-step active' : 'flow-step'}>
            <span className="flow-index">{step.id}</span>
            <span className="flow-label">{step.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
