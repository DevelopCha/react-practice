import type { ReactNode } from 'react';
import { ApiActivityList } from './ApiActivityList';
import { ApiDetailInspector } from './ApiDetailInspector';
import { CallStackViewer } from './CallStackViewer';
import { RawConsoleDrawer } from './RawConsoleDrawer';
import { StateDiffViewer } from './StateDiffViewer';
import { TraceSessionViewer } from './TraceSessionViewer';

type TraceMonitorLayoutProps = {
  title: string;
  subtitle: string;
  actionPanel: ReactNode;
  notes: ReactNode;
  rawState?: unknown;
  rawStateLabel?: string;
};

export function TraceMonitorLayout({ title, subtitle, actionPanel, notes, rawState, rawStateLabel }: TraceMonitorLayoutProps) {
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
            <div className="panel-title">Mini Action Panel</div>
            {actionPanel}
          </section>

          <section className="panel learning-notes-panel compact">
            <div className="panel-title">Click Anatomy</div>
            <div className="learning-notes">{notes}</div>
          </section>
        </aside>

        <section className="runtime-monitoring-area">
          <TraceSessionViewer />
          <div className="trace-api-grid">
            <ApiActivityList />
            <ApiDetailInspector />
          </div>
          <div className="trace-bottom-grid">
            <StateDiffViewer rawState={rawState} rawStateLabel={rawStateLabel} />
            <CallStackViewer />
          </div>
          <RawConsoleDrawer />
        </section>
      </section>
    </main>
  );
}
