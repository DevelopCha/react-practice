import { useRuntime } from '../runtime/RuntimeContext';
import { openSourceInVscode, parseSourceTarget } from '../runtime/sourceLink';

function stringify(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function summarizeStepResult(step: { status?: string; data?: unknown; timestamp?: string }) {
  if (step.data !== undefined) {
    return stringify(step.data);
  }

  if (step.status === 'active') {
    return '처리 중입니다. 이 단계가 끝나면 결과 값이나 완료 시간이 여기에 남습니다.';
  }

  if (step.status === 'done') {
    return step.timestamp ? `완료됨\n${step.timestamp}` : '완료됨';
  }

  return '아직 실행 전입니다.';
}

export function TraceSessionViewer() {
  const { traceSession, flowSteps, activeStepId, selectFlowStep } = useRuntime();

  return (
    <section className="panel trace-session-panel">
      <div className="panel-title">Execution Timeline</div>
      <div className="trace-session-meta">
        {traceSession ? (
          <>
            <strong>Session #{traceSession.id}</strong>
            <span>{traceSession.title}</span>
            {traceSession.input !== undefined && <code>{stringify(traceSession.input)}</code>}
            {traceSession.result && <span className="trace-session-result">{traceSession.result}</span>}
          </>
        ) : (
          <span className="muted">Run an Input Lab action to start a focused experiment session.</span>
        )}
      </div>

      <div className="trace-step-list">
        {flowSteps.map((step, index) => {
          const sourceTarget = parseSourceTarget(step.codeLocation);
          const stepStatus = step.status ?? (step.id === activeStepId ? 'active' : 'pending');

          const handleStepClick = () => {
            selectFlowStep(step.id);

            if (sourceTarget) {
              openSourceInVscode(step.codeLocation);
            }
          };

          return (
            <button
              key={step.id}
              type="button"
              className={['trace-step', stepStatus, sourceTarget ? 'source-linked' : '']
                .filter(Boolean)
                .join(' ')}
              onClick={handleStepClick}
            >
              <span className="trace-step-index">{index + 1}</span>
              <div className="trace-step-body">
                <div className="trace-step-heading">
                  <strong>{step.label}</strong>
                  <span className={`trace-step-status ${stepStatus}`}>{stepStatus}</span>
                </div>
                {step.meaning && <p>{step.meaning}</p>}
                {step.codeLocation && (
                  <div className="trace-source-row">
                    <code>{step.codeLocation}</code>
                    {sourceTarget && <em>Click to open source</em>}
                  </div>
                )}
              </div>
              <div className="trace-step-result" aria-label={`${step.label} result`}>
                <span>Result</span>
                <pre>{summarizeStepResult({ ...step, status: stepStatus })}</pre>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
