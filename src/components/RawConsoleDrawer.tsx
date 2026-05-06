import { ExecutionConsole } from './ExecutionConsole';

export function RawConsoleDrawer() {
  return (
    <details className="raw-console-drawer">
      <summary>Raw Console Log</summary>
      <ExecutionConsole />
    </details>
  );
}
