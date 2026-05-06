import { useRuntime } from '../runtime/RuntimeContext';

function stringify(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export function MeaningPanel() {
  const { selectedCheckpoint, selectedStep, traceSession, stateDiffReason } = useRuntime();
  const selectedData = selectedCheckpoint?.data ?? selectedStep?.data;
  const selectedMeaning = selectedCheckpoint?.meaning ?? selectedStep?.meaning;
  const selectedCodeLocation = selectedCheckpoint?.codeLocation ?? selectedStep?.codeLocation;
  const selectedLabel = selectedCheckpoint?.label ?? selectedStep?.label ?? traceSession?.title;
  const selectedStatus = selectedStep?.status ?? 'pending';
  const selectedTimestamp = selectedCheckpoint?.timestamp ?? selectedStep?.timestamp;

  return (
    <section className="panel meaning-panel">
      <div className="panel-title">Meaning Panel</div>
      {!traceSession && <span className="muted">A session story will appear after you run an experiment.</span>}
      {traceSession && (
        <div className="meaning-content">
          <div>
            <div className="meaning-heading">
              <strong>{selectedLabel}</strong>
              {selectedStep && <span className={`meaning-status ${selectedStatus}`}>{selectedStatus}</span>}
            </div>
            <p>
              {selectedMeaning ??
                '이 단계는 사용자의 실행 행동 중 하나입니다. 실행 중에는 현재 단계의 설명과 결과 데이터가 이 패널에 표시됩니다.'}
            </p>
          </div>
          {traceSession.result && (
            <div className="reason-box">
              <span>Session result</span>
              <p>{traceSession.result}</p>
            </div>
          )}
          {selectedStep && (
            <div className="reason-box">
              <span>Execution result</span>
              <p>
                {selectedStatus === 'active' && '현재 처리 중인 단계입니다. 데이터와 상태 변경 이유를 함께 확인하세요.'}
                {selectedStatus === 'done' && '이미 처리된 단계입니다. 실행 당시의 입력, 변환 데이터, 결과를 확인할 수 있습니다.'}
                {selectedStatus === 'pending' && '아직 실행 전 단계입니다. RUN을 누르면 이 단계까지 흐름이 도달하는지 확인할 수 있습니다.'}
              </p>
              {selectedTimestamp && <code className="code-location">{selectedTimestamp}</code>}
            </div>
          )}
          {stateDiffReason && (
            <div className="reason-box">
              <span>State change reason</span>
              <p>{stateDiffReason}</p>
            </div>
          )}
          {selectedData !== undefined && (
            <details className="checkpoint-details" open>
              <summary>Selected step data</summary>
              <pre>{stringify(selectedData)}</pre>
            </details>
          )}
          {selectedCodeLocation && <code className="code-location">{selectedCodeLocation}</code>}
        </div>
      )}
    </section>
  );
}
