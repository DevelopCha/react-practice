import { useAuthState } from '../context/AuthContext';
import { useRuntime } from '../runtime/RuntimeContext';

function stringify(value: unknown) {
  return JSON.stringify(value, null, 2);
}

type StateDiffViewerProps = {
  rawState?: unknown;
  rawStateLabel?: string;
};

export function StateDiffViewer({ rawState, rawStateLabel = 'AuthContext' }: StateDiffViewerProps) {
  const authState = useAuthState();
  const { stateDiff, stateDiffReason } = useRuntime();
  const visibleRawState = rawState ?? authState;

  return (
    <section className="panel state-diff-panel">
      <div className="panel-title">State Change Inspector</div>
      {stateDiffReason && <p className="state-diff-reason">{stateDiffReason}</p>}
      <div className="state-diff-list">
        {stateDiff.length === 0 && <span className="muted">Meaningful state changes will appear after dispatch and reducer execution.</span>}
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
        <summary>Raw {rawStateLabel} JSON</summary>
        <pre>{stringify(visibleRawState)}</pre>
      </details>
    </section>
  );
}
