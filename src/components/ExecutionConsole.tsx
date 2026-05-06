import { useRuntime } from '../runtime/RuntimeContext';

export function ExecutionConsole() {
  const { logs } = useRuntime();

  return (
    <section className="panel console-panel">
      <div className="panel-title">Real-time Execution Console</div>
      <div className="console-output">
        {logs.length === 0 && <div className="console-empty">Runtime logs will appear here.</div>}
        {logs.map((log) => (
          <div key={log.id} className="console-line">
            <span>[{log.kind}]</span> {log.message}
          </div>
        ))}
      </div>
    </section>
  );
}
