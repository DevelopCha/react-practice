import { useRuntime } from '../runtime/RuntimeContext';

export function CallStackViewer() {
  const { callStack } = useRuntime();

  return (
    <section className="panel stack-panel">
      <div className="panel-title">Function Call Stack Viewer</div>
      <div className="stack-list">
        {callStack.length === 0 && <span className="muted">No active call chain.</span>}
        {callStack.map((item, index) => (
          <div key={`${item}-${index}`} className="stack-line">
            {index > 0 && <span className="arrow">-&gt;</span>}
            <code>{item}</code>
          </div>
        ))}
      </div>
    </section>
  );
}
