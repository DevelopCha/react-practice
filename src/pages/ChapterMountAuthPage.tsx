import { useEffect, useState } from 'react';
import { authApi } from '../api/authApi';
import { TraceMonitorLayout } from '../components/TraceMonitorLayout';
import { useAuthDispatch, useAuthState } from '../context/AuthContext';
import { useCommon } from '../context/CommonContext';
import { AUTH_RESTORE, LOGOUT } from '../reducers/authActionTypes';
import { addFlowStep } from '../runtime/flowTracker';
import { addLog } from '../runtime/logger';
import { useRuntime } from '../runtime/RuntimeContext';
import type { MockServerFailure } from '../runtime/mockServer';

export function ChapterMountAuthPage() {
  const [pending, setPending] = useState(false);
  const authState = useAuthState();
  const authDispatch = useAuthDispatch();
  const { setActiveChapter } = useCommon();
  const { beginTraceSession, captureStateDiff, refreshRuntimeSnapshot } = useRuntime();

  useEffect(() => {
    setActiveChapter('Chapter 1 - App Mount & Auth Check');
  }, [setActiveChapter]);

  const runAuthCheck = () => {
    const beforeState = authState;
    setPending(true);

    beginTraceSession('Auth Check', 'handleAuthCheck()', [
      'ChapterMountAuthPage.handleAuthCheck',
      'authApi.checkAuth',
      'axiosClient.get',
      'mockServer.request',
      'dispatch(AUTH_RESTORE | LOGOUT)',
      'authReducer',
    ]);

    addLog('Effect', 'manual auth initialization started');
    addFlowStep('auth initialization effect simulated');

    authApi
      .checkAuth()
      .then((response) => {
        addLog('Dispatch', 'dispatch(AUTH_RESTORE)');
        addFlowStep('dispatch AUTH_RESTORE');
        authDispatch({ type: AUTH_RESTORE, payload: { userInfo: response.data, message: response.message } });
        addFlowStep('authReducer restores session');
        captureStateDiff(beforeState, {
          ...beforeState,
          isLogin: true,
          userInfo: response.data,
          authChecked: true,
          loading: false,
          error: null,
          message: response.message,
        });
      })
      .catch((error: MockServerFailure) => {
        const errorMessage = error.response?.message ?? 'auth check failed';
        addLog('Dispatch', 'dispatch(LOGOUT) fallback');
        addFlowStep('dispatch LOGOUT fallback');
        authDispatch({ type: LOGOUT, payload: { error: errorMessage } });
        addFlowStep('authReducer marks authChecked fallback');
        captureStateDiff(beforeState, {
          isLogin: false,
          userInfo: null,
          authChecked: true,
          loading: false,
          error: errorMessage,
          message: null,
        });
      })
      .finally(() => {
        setPending(false);
        addLog('Render', 'Header rerendered from AuthContext update');
        addFlowStep('Header rerender complete');
        refreshRuntimeSnapshot();
      });
  };

  return (
    <TraceMonitorLayout
      title="Chapter 1 - App Mount & Auth Check"
      subtitle="Run the startup auth restoration lifecycle as a focused trace session."
      rawState={authState}
      rawStateLabel="AuthContext"
      actionPanel={
        <div className="mini-stack">
          <div className="status-box">
            <strong>Session</strong>
            <span>{authState.isLogin ? `Restored: ${authState.userInfo?.id}` : 'Anonymous'}</span>
          </div>
          <button type="button" onClick={runAuthCheck} disabled={pending}>
            {pending ? 'Checking...' : 'Run auth check'}
          </button>
          {authState.error && <p className="error-text">{authState.error}</p>}
        </div>
      }
      notes={
        <>
          <p>
            Component: <code>src/pages/ChapterMountAuthPage.tsx</code>
          </p>
          <p>
            API: <code>src/api/authApi.ts</code>
          </p>
          <p>
            Reducer: <code>src/reducers/authReducer.ts</code>
          </p>
          <p>
            Path: <code>handleAuthCheck -&gt; authApi.checkAuth -&gt; axiosClient.get -&gt; mockServer.request -&gt; dispatch -&gt; authReducer -&gt; rerender</code>
          </p>
          <p>
            Mock: <code>?mock=auth:200:restored</code> or <code>?mock=auth:500:session-failed</code>
          </p>
        </>
      }
    />
  );
}
