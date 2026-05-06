import { useAuthState } from '../context/AuthContext';
import { useRuntime } from '../runtime/RuntimeContext';

function stringify(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export function StateDiffViewer() {
  const authState = useAuthState();
  const { stateDiff } = useRuntime();

  return (
    <section className="panel state-diff-panel">
      <div className="panel-title">State Diff Viewer</div>
      <div className="state-diff-list">
        {stateDiff.length === 0 && <span className="muted">State changes will appear after dispatch and reducer execution.</span>}
        {stateDiff.map((diff) => (
          <div key={diff.path} className="state-diff-row">
            <strong>{diff.path}</strong>
            <code>{stringify(diff.before)}</code>
            <span>-&gt;</span>
            <code>{stringify(diff.after)}</code>
          </div>
        ))}
      </div>
      <details className="raw-state-details">
        <summary>Raw AuthContext JSON</summary>
        <pre>{stringify(authState)}</pre>
      </details>
    </section>
  );
}
