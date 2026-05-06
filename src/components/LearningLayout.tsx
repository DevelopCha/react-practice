import type { ReactNode } from 'react';
import { CallStackViewer } from './CallStackViewer';
import { ExecutionConsole } from './ExecutionConsole';
import { FlowVisualizer } from './FlowVisualizer';
import { StateViewer } from './StateViewer';

type LearningLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function LearningLayout({ title, subtitle, children }: LearningLayoutProps) {
  return (
    <main className="chapter-page">
      <div className="chapter-heading">
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="learning-grid">
        <section className="panel mini-app-panel">
          <div className="panel-title">Mini Working App</div>
          {children}
        </section>
        <FlowVisualizer />
        <StateViewer />
        <CallStackViewer />
        <ExecutionConsole />
      </div>
    </main>
  );
}
