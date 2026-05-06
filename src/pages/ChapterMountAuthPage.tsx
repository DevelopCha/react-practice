import { useEffect } from 'react';
import { LearningLayout } from '../components/LearningLayout';
import { useAuth } from '../context/AuthContext';
import { useCommon } from '../context/CommonContext';
import { useRuntime } from '../runtime/RuntimeContext';
import type { FlowStep, RuntimeEvent } from '../types/runtime';

const steps: FlowStep[] = [
  { id: 'mount', label: 'App.tsx mounted' },
  { id: 'effect', label: 'useEffect auth init executed' },
  { id: 'api', label: 'authApi.check() called' },
  { id: 'axios', label: 'axiosClient.get() requested' },
  { id: 'mock', label: 'mockServer returns response' },
  { id: 'dispatch', label: 'dispatch(AUTH_RESTORE)' },
  { id: 'reducer', label: 'authReducer updates state' },
  { id: 'render', label: 'Header rerendered' },
];

export function ChapterMountAuthPage() {
  const { state, checkAuth } = useAuth();
  const { setActiveChapter } = useCommon();
  const { resetRuntime, runEvents, appendLog, setCallStack } = useRuntime();

  useEffect(() => {
    setActiveChapter('Chapter 1 - App Mount & Auth Check');
    resetRuntime(steps);
    runEvents([{ stepId: 'mount', kind: 'Mount', message: 'App.tsx mounted' }]);
  }, [resetRuntime, runEvents, setActiveChapter]);

  const runAuthCheck = async () => {
    const beforeEvents: RuntimeEvent[] = [
      { stepId: 'effect', kind: 'Effect', message: 'useEffect auth init executed', callStack: ['useEffect()', 'checkAuth()'] },
      { stepId: 'api', kind: 'API', message: 'authApi.check() called', callStack: ['checkAuth()', 'authApi.check()'] },
      {
        stepId: 'axios',
        kind: 'API',
        message: 'axiosClient.get("/auth/check") requested',
        callStack: ['checkAuth()', 'authApi.check()', 'axiosClient.get()'],
      },
    ];

    await runEvents(beforeEvents);
    await checkAuth();

    if (state.error) {
      appendLog('Error', `Previous auth error was visible before this run: ${state.error}`);
    }

    await runEvents([
      {
        stepId: 'mock',
        kind: 'Mock',
        message: 'auth mock resolved or rejected from query string config',
        callStack: ['checkAuth()', 'authApi.check()', 'axiosClient.get()', 'mockServer.request()'],
      },
      { stepId: 'dispatch', kind: 'Dispatch', message: 'AUTH_RESTORE or LOGIN_FAILURE dispatched' },
      { stepId: 'reducer', kind: 'Reducer', message: 'authReducer calculated next AuthContext state' },
      { stepId: 'render', kind: 'Render', message: 'Header rerendered from AuthContext update', callStack: [] },
    ]);
  };

  return (
    <LearningLayout title="Chapter 1 - App Mount & Auth Check" subtitle="Trace initial session restoration through Context and reducer state.">
      <div className="mini-stack">
        <div className="status-box">
          <strong>Session</strong>
          <span>{state.loading ? 'Checking...' : state.isLogin ? `Restored: ${state.userInfo?.id}` : 'Anonymous'}</span>
        </div>
        <button type="button" onClick={runAuthCheck} disabled={state.loading}>
          Run auth check
        </button>
        {state.error && <p className="error-text">{state.error}</p>}
      </div>
    </LearningLayout>
  );
}
