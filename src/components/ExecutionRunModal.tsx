import { useEffect, useMemo, useRef, useState } from 'react';
import { useRuntime } from '../runtime/RuntimeContext';
import { openSourceInVscode, parseSourceTarget } from '../runtime/sourceLink';

type ExecutionRunModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
};

const GRAPH_COLUMN_WIDTH = 170;
const GRAPH_ROW_HEIGHT = 120;
const GRAPH_NODE_WIDTH = 150;
const GRAPH_NODE_HEIGHT = 72;
const GRAPH_NODE_PADDING = 24;

function compactStringify(value: unknown) {
  return JSON.stringify(value);
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

function formatTime(timestamp?: string) {
  if (!timestamp) {
    return '';
  }

  return new Date(timestamp).toLocaleTimeString('ko-KR', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function summarizeStepOutput(step: { data?: unknown; changeSummary?: string; status?: string }) {
  if (step.changeSummary) {
    return step.changeSummary;
  }

  if (step.data && typeof step.data === 'object' && !Array.isArray(step.data)) {
    const record = step.data as Record<string, unknown>;

    if (record.toBe !== undefined) {
      return `TO-BE ${compactStringify(record.toBe)}`;
    }

    if (record.reason !== undefined) {
      return String(record.reason);
    }
  }

  if (step.data !== undefined) {
    return compactStringify(step.data);
  }

  if (step.status === 'active') {
    return '현재 실행 중입니다.';
  }

  if (step.status === 'done') {
    return '단계 실행이 완료되었습니다.';
  }

  return '실행 대기 중입니다.';
}

export function ExecutionRunModal({ open, onClose, title }: ExecutionRunModalProps) {
  const {
    traceSession,
    flowSteps,
    activeStepId,
    selectedStep,
    selectFlowStep,
    logs,
  } = useRuntime();
  const consoleRef = useRef<HTMLDivElement | null>(null);
  const graphViewportRef = useRef<HTMLDivElement | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [graphZoom, setGraphZoom] = useState(1);
  const [fitScale, setFitScale] = useState(1);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [flowSteps, logs]);

  useEffect(() => {
    if (!open) {
      setCollapsed(false);
    }
  }, [open]);

  const compactSteps = useMemo(
    () =>
      flowSteps.map((step, index) => ({
        ...step,
        index: index + 1,
        status: step.status ?? (step.id === activeStepId ? 'active' : 'pending'),
      })),
    [activeStepId, flowSteps],
  );

  const graphLayout = useMemo(() => {
    const graphSteps = compactSteps.filter(
      (step) => step.graphColumn !== undefined && step.graphRow !== undefined,
    );
    const maxColumn = Math.max(...graphSteps.map((step) => step.graphColumn ?? 0), 0);
    const maxRow = Math.max(...graphSteps.map((step) => step.graphRow ?? 0), 0);
    const width = (maxColumn + 1) * GRAPH_COLUMN_WIDTH + GRAPH_NODE_PADDING * 2;
    const height = (maxRow + 1) * GRAPH_ROW_HEIGHT + GRAPH_NODE_PADDING * 2;
    const nodeById = new Map(graphSteps.map((step) => [step.id, step]));
    const nodeByLabel = new Map(graphSteps.map((step) => [step.label, step]));

    const nodes = graphSteps.map((step) => {
      const x = GRAPH_NODE_PADDING + (step.graphColumn ?? step.index - 1) * GRAPH_COLUMN_WIDTH;
      const y = GRAPH_NODE_PADDING + (step.graphRow ?? 0) * GRAPH_ROW_HEIGHT;

      return {
        ...step,
        x,
        y,
      };
    });

    const edges = nodes.flatMap((step) =>
      (step.graphParents ?? []).flatMap((parentId) => {
        const parent = nodeById.get(parentId) ?? nodeByLabel.get(parentId);

        if (!parent) {
          return [];
        }

        const fromX = GRAPH_NODE_PADDING + (parent.graphColumn ?? 0) * GRAPH_COLUMN_WIDTH + GRAPH_NODE_WIDTH;
        const fromY = GRAPH_NODE_PADDING + (parent.graphRow ?? 0) * GRAPH_ROW_HEIGHT + GRAPH_NODE_HEIGHT / 2;
        const toX = step.x;
        const toY = step.y + GRAPH_NODE_HEIGHT / 2;
        const midX = (fromX + toX) / 2;

        return [{
          id: `${parentId}->${step.id}`,
          fromX,
          fromY,
          toX,
          toY,
          midX,
          order: step.index,
          active:
            parent.status === 'done' ||
            parent.status === 'active' ||
            step.status === 'done' ||
            step.status === 'active',
        }];
      }),
    );

    return { width, height, nodes, edges };
  }, [compactSteps]);

  const consoleSteps = useMemo(
    () =>
      compactSteps.filter((step) => step.status !== 'pending' || step.id === activeStepId),
    [activeStepId, compactSteps],
  );

  const consoleLines = useMemo(() => {
    const stepEntries = consoleSteps.map((step) => ({
      timestamp: step.timestamp ?? '',
      type: 'step' as const,
      text: [
        `${formatTime(step.timestamp)} [STEP ${step.index}] ${getStatusLabel(step.status)} ${step.label}${step.layer ? ` (${step.layer})` : ''}`,
        summarizeStepOutput(step),
      ].join('\n'),
    }));

    const logEntries = logs.map((log) => ({
      timestamp: log.timestamp ?? '',
      type: 'log' as const,
      text: `${formatTime(log.timestamp)} [${log.kind}] ${log.message}`,
    }));

    return [...stepEntries, ...logEntries]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp) || a.type.localeCompare(b.type))
      .map((entry) => entry.text);
  }, [consoleSteps, logs]);

  const effectiveGraphScale = fitScale * graphZoom;
  const scaledGraphWidth = graphLayout.width * effectiveGraphScale;
  const scaledGraphHeight = graphLayout.height * effectiveGraphScale;

  useEffect(() => {
    if (!open || collapsed || !graphViewportRef.current) {
      return;
    }

    const viewport = graphViewportRef.current;

    const updateScale = () => {
      const nextFitScale = Math.min(
        viewport.clientWidth / graphLayout.width,
        viewport.clientHeight / graphLayout.height,
        1,
      );

      setFitScale(Number.isFinite(nextFitScale) && nextFitScale > 0 ? nextFitScale : 1);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(viewport);

    return () => observer.disconnect();
  }, [collapsed, graphLayout.height, graphLayout.width, open]);

  if (!open) {
    return null;
  }

  const sourceTarget = parseSourceTarget(selectedStep?.codeLocation);

  return (
    <div
      className={collapsed ? 'execution-run-modal-backdrop collapsed' : 'execution-run-modal-backdrop'}
      role="presentation"
      onClick={collapsed ? undefined : onClose}
    >
      <section
        className={collapsed ? 'execution-run-modal collapsed' : 'execution-run-modal'}
        role="dialog"
        aria-modal="true"
        aria-labelledby="execution-run-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="execution-run-modal-header">
          <div>
            <span className="eyebrow">Live Run</span>
            <h2 id="execution-run-modal-title">{title}</h2>
            <p>좌측은 실행 흐름 맵, 우측은 step 전환과 로그 이벤트가 같이 쌓이는 누적 콘솔입니다.</p>
          </div>
          <div className="execution-run-header-actions">
            <button type="button" className="ghost-link-button" onClick={() => setCollapsed((value) => !value)}>
              {collapsed ? 'Expand' : 'Collapse'}
            </button>
            <button type="button" className="modal-close-button" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        <div className="execution-run-modal-body">
          <section className="execution-graph-panel">
            <div className="execution-graph-toolbar">
              <div className="panel-title">Flow Graph</div>
              <div className="execution-graph-controls">
                <button type="button" className="ghost-link-button" onClick={() => setGraphZoom((value) => Math.max(0.7, value - 0.1))}>
                  -
                </button>
                <span>{Math.round(effectiveGraphScale * 100)}%</span>
                <button type="button" className="ghost-link-button" onClick={() => setGraphZoom((value) => Math.min(1.8, value + 0.1))}>
                  +
                </button>
                <button type="button" className="ghost-link-button" onClick={() => setGraphZoom(1)}>
                  Fit
                </button>
              </div>
            </div>
            <div ref={graphViewportRef} className="execution-graph-viewport">
              <div
                className="execution-graph-canvas"
                aria-label="Execution flow graph"
                style={{ width: scaledGraphWidth, height: scaledGraphHeight }}
              >
              <svg
                className="execution-graph-svg"
                viewBox={`0 0 ${graphLayout.width} ${graphLayout.height}`}
                preserveAspectRatio="xMinYMin meet"
                style={{ transform: `scale(${effectiveGraphScale})`, transformOrigin: 'top left' }}
              >
                <defs>
                  <marker id="execution-arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
                    <path d="M0,0 L12,6 L0,12 z" fill="#7da89e" />
                  </marker>
                </defs>
                {graphLayout.edges.map((edge) => (
                  <g key={edge.id}>
                    <path
                      d={`M ${edge.fromX} ${edge.fromY} C ${edge.midX} ${edge.fromY}, ${edge.midX} ${edge.toY}, ${edge.toX} ${edge.toY}`}
                      className={edge.active ? 'execution-graph-edge active' : 'execution-graph-edge'}
                      markerEnd="url(#execution-arrow)"
                    />
                    <circle className="execution-edge-order-dot" cx={edge.midX} cy={(edge.fromY + edge.toY) / 2} r="13" />
                    <text className="execution-edge-order-text" x={edge.midX} y={(edge.fromY + edge.toY) / 2 + 4} textAnchor="middle">
                      {edge.order}
                    </text>
                  </g>
                ))}
              </svg>
              <div
                className="execution-graph-track"
                style={{
                  width: graphLayout.width,
                  height: graphLayout.height,
                  transform: `scale(${effectiveGraphScale})`,
                  transformOrigin: 'top left',
                }}
              >
                {graphLayout.nodes.map((step) => (
                  <button
                    key={step.id}
                    type="button"
                    className={['execution-node', step.status, selectedStep?.id === step.id ? 'selected' : '']
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => selectFlowStep(step.id)}
                    style={{ left: step.x, top: step.y, width: GRAPH_NODE_WIDTH, minHeight: GRAPH_NODE_HEIGHT }}
                  >
                    <span className="execution-node-index">{step.index}</span>
                    <span className="execution-node-main">
                      <strong>{step.label}</strong>
                      <span className="execution-node-meta">
                        <span>{getStatusLabel(step.status)}</span>
                        {step.layer && <span>{step.layer}</span>}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
              <div className="execution-graph-legend">
                <span><i className="legend-dot wait" /> WAIT</span>
                <span><i className="legend-dot running" /> RUNNING</span>
                <span><i className="legend-dot success" /> SUCCESS</span>
                <span><i className="legend-line" /> branch / parallel ready</span>
              </div>
            </div>
            </div>
          </section>

          <section className="execution-terminal-panel">
            <div className="execution-terminal-header">
              <div>
                <div className="panel-title">Live Console</div>
                <p>
                  {selectedStep
                    ? `${getStatusLabel(selectedStep.status)} · ${selectedStep.label}`
                    : '실행을 시작하면 step 로그가 누적됩니다.'}
                </p>
              </div>
              <div className="execution-terminal-actions">
                {selectedStep?.codeLocation && <code>{selectedStep.codeLocation}</code>}
                {sourceTarget && (
                  <button
                    type="button"
                    className="inline-link-button"
                    onClick={() => openSourceInVscode(sourceTarget)}
                  >
                    Open in VS Code
                  </button>
                )}
              </div>
            </div>
            <div className="execution-terminal" ref={consoleRef}>
              {consoleLines.length === 0 && <div className="console-empty">실행될 때마다 로그가 아래로 누적됩니다.</div>}
              {consoleLines.map((line, index) => (
                <pre key={`${index}-${line.slice(0, 24)}`} className="execution-terminal-line">
                  {line}
                </pre>
              ))}
              {traceSession?.result && <pre className="execution-terminal-line final">{`[RESULT]\n${traceSession.result}`}</pre>}
              {logs.length > 0 && (
                <details className="execution-raw-log-details">
                  <summary>Raw event log</summary>
                  <div className="execution-raw-log-list">
                    {logs.map((log) => (
                      <div key={log.id} className="console-line raw">
                        <time>{formatTime(log.timestamp)}</time>
                        <span>[{log.kind}]</span>
                        <code>{log.message}</code>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
