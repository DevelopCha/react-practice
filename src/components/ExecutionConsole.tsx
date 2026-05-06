import { useEffect, useRef } from 'react';
import { useRuntime } from '../runtime/RuntimeContext';

type ExecutionConsoleProps = {
  title?: string;
  tall?: boolean;
};

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

export function ExecutionConsole({ title = 'Real-time Execution Console', tall = false }: ExecutionConsoleProps) {
  const { logs } = useRuntime();
  const outputRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <section className={['panel', 'console-panel', tall ? 'console-panel-tall' : ''].filter(Boolean).join(' ')}>
      <div className="panel-title">{title}</div>
      <div className="console-output" ref={outputRef}>
        {logs.length === 0 && <div className="console-empty">Runtime logs will appear here.</div>}
        {logs.map((log) => (
          <div key={log.id} className="console-line">
            <time>{formatTime(log.timestamp)}</time>
            <span>[{log.kind}]</span>
            <code>{log.message}</code>
          </div>
        ))}
      </div>
    </section>
  );
}
