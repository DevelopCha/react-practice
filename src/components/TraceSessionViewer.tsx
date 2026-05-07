import { useEffect, useRef } from 'react';
import { useRuntime } from '../runtime/RuntimeContext';
import { openSourceInVscode, parseSourceTarget } from '../runtime/sourceLink';

function stringify(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function summarizeStructuredResult(data: Record<string, unknown>) {
  if ('asIs' in data || 'toBe' in data) {
    const sections: string[] = [];

    if (data.asIs !== undefined) {
      sections.push(`AS-IS\n${stringify(data.asIs)}`);
    }

    if (data.toBe !== undefined) {
      sections.push(`TO-BE\n${stringify(data.toBe)}`);
    }

    if (data.reason !== undefined) {
      sections.push(`REASON\n${String(data.reason)}`);
    }

    return sections.join('\n\n');
  }

  return stringify(data);
}

function summarizeStepResult(step: { status?: string; data?: unknown; timestamp?: string }) {
  if (step.data && typeof step.data === 'object' && !Array.isArray(step.data)) {
    return summarizeStructuredResult(step.data as Record<string, unknown>);
  }

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

function getStatusLabel(status?: string) {
  if (status === 'active') {
    return 'RUNNING';
  }

  if (status === 'done') {
    return 'SUCCESS';
  }

  return 'WAIT';
}

function getImportanceLabel(importance?: 'core' | 'support') {
  return importance === 'core' ? 'CORE' : 'SUPPORT';
}

export type TraceStepAction = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

type TraceSessionViewerProps = {
  stepActions?: Record<string, TraceStepAction>;
};

export function TraceSessionViewer({ stepActions = {} }: TraceSessionViewerProps) {
  const { traceSession, flowSteps, activeStepId, selectFlowStep } = useRuntime();
  const stepRefs = useRef<Record<string, HTMLElement | null>>({});
  const sessionMetaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!activeStepId) {
      return;
    }

    const activeElement = stepRefs.current[activeStepId];

    if (!activeElement) {
      return;
    }

    activeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
    activeElement.focus({ preventScroll: true });
  }, [activeStepId]);

  useEffect(() => {
    if (!traceSession?.result || flowSteps.length === 0) {
      return;
    }

    const lastStep = flowSteps[flowSteps.length - 1];
    const lastElement = stepRefs.current[lastStep.id];

    if (lastElement) {
      lastElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      lastElement.focus({ preventScroll: true });
      return;
    }

    sessionMetaRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, [flowSteps, traceSession?.result]);

  return (
    <section className="panel trace-session-panel">
      <div className="panel-title">Execution Timeline</div>
      <div ref={sessionMetaRef} className="trace-session-meta">
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
          const stepAction = stepActions[step.id];
          const handleStepSelect = () => selectFlowStep(step.id);
          const handleSourceOpen = () => {
            if (sourceTarget) {
              openSourceInVscode(sourceTarget);
            }
          };
          const handleStepAction = () => {
            stepAction?.onClick();
          };

          return (
            <article
              key={step.id}
              ref={(element) => {
                stepRefs.current[step.id] = element;
              }}
              tabIndex={-1}
              className={['trace-step', stepStatus, sourceTarget ? 'source-linked' : '']
                .filter(Boolean)
                .join(' ')}
              onClick={handleStepSelect}
            >
              <span className="trace-step-index">{index + 1}</span>
              <div className="trace-step-body">
                <div className="trace-step-heading">
                  <strong>{step.label}</strong>
                  <span className={`trace-step-status ${stepStatus}`}>{getStatusLabel(stepStatus)}</span>
                  {step.importance && (
                    <span className={`trace-step-badge ${step.importance}`}>{getImportanceLabel(step.importance)}</span>
                  )}
                  {step.layer && <span className="trace-step-badge layer">{step.layer}</span>}
                </div>
                {step.meaning && <p>{step.meaning}</p>}
                {(step.changeSummary || step.breakpointTip) && (
                  <div className="trace-step-hints">
                    {step.changeSummary && (
                      <div className="trace-hint-box">
                        <span>Changed</span>
                        <p>{step.changeSummary}</p>
                      </div>
                    )}
                    {step.breakpointTip && (
                      <div className="trace-hint-box">
                        <span>Breakpoint</span>
                        <p>{step.breakpointTip}</p>
                      </div>
                    )}
                  </div>
                )}
                {step.codeLocation && (
                  <div className="trace-source-row">
                    <code>{step.codeLocation}</code>
                    {sourceTarget && (
                      <button
                        type="button"
                        className="inline-link-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleSourceOpen();
                        }}
                      >
                        Open in VS Code
                      </button>
                    )}
                    {stepAction && (
                      <button
                        type="button"
                        className="inline-run-button"
                        disabled={stepAction.disabled}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleStepAction();
                        }}
                      >
                        {stepAction.label}
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="trace-step-result" aria-label={`${step.label} result`}>
                <span>Result</span>
                <pre>{summarizeStepResult({ ...step, status: stepStatus })}</pre>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
