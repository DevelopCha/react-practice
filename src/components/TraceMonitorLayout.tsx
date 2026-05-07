import type { ReactNode } from 'react';
import { ApiActivityList } from './ApiActivityList';
import { ApiDetailInspector } from './ApiDetailInspector';
import { ApiLabEditor } from './ApiLabEditor';
import { CallStackViewer } from './CallStackViewer';
import { ExecutionConsole } from './ExecutionConsole';
import { MeaningPanel } from './MeaningPanel';
import { StateDiffViewer } from './StateDiffViewer';
import { TraceSessionViewer, type TraceStepAction } from './TraceSessionViewer';

type TraceMonitorLayoutProps = {
  title: string;
  subtitle: string;
  actionPanel: ReactNode;
  notes: ReactNode;
  processGuide?: ReactNode;
  rawState?: unknown;
  rawStateLabel?: string;
  apiLabKeys?: string[];
  stepActions?: Record<string, TraceStepAction>;
};

export function TraceMonitorLayout({
  title,
  subtitle,
  actionPanel,
  notes,
  processGuide,
  rawState,
  rawStateLabel,
  apiLabKeys = [],
  stepActions,
}: TraceMonitorLayoutProps) {
  return (
    <main className="login-flow-page">
      <section className="chapter-heading">
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </section>

      <section className="runtime-monitor-layout">
        <aside className="mini-action-column">
          <section className="panel mini-action-panel">
            <div className="panel-title">Input Lab</div>
            {actionPanel}
          </section>

          {processGuide && (
            <section className="panel process-guide-panel">
              <div className="panel-title">Process Guide</div>
              <div className="process-guide">{processGuide}</div>
            </section>
          )}

          {apiLabKeys.length > 0 && (
            <section className="panel api-lab-panel">
              <ApiLabEditor apiKeys={apiLabKeys} />
            </section>
          )}

          <section className="panel learning-notes-panel compact">
            <div className="panel-title">Click Anatomy</div>
            <div className="learning-notes">{notes}</div>
          </section>
        </aside>

        <section className="runtime-monitoring-area">
          <TraceSessionViewer stepActions={stepActions} />
          <ExecutionConsole title="Process Console" tall />
          <MeaningPanel />
          <div className="trace-api-grid">
            <ApiActivityList />
            <ApiDetailInspector />
          </div>
          <div className="trace-bottom-grid">
            <StateDiffViewer rawState={rawState} rawStateLabel={rawStateLabel} />
            <CallStackViewer />
          </div>
        </section>
      </section>
    </main>
  );
}
