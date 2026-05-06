import { FormEvent, useEffect, useState } from 'react';
import { authApi } from '../api/authApi';
import { ApiActivityList } from '../components/ApiActivityList';
import { ApiDetailInspector } from '../components/ApiDetailInspector';
import { CallStackViewer } from '../components/CallStackViewer';
import { RawConsoleDrawer } from '../components/RawConsoleDrawer';
import { StateDiffViewer } from '../components/StateDiffViewer';
import { TraceSessionViewer } from '../components/TraceSessionViewer';
import { useAuthDispatch, useAuthState } from '../context/AuthContext';
import { AUTH_RESTORE, LOGIN_SUCCESS, LOGOUT } from '../reducers/authActionTypes';
import { addFlowStep } from '../runtime/flowTracker';
import { addLog } from '../runtime/logger';
import { useRuntime } from '../runtime/RuntimeContext';
import type { MockServerFailure } from '../runtime/mockServer';

export function LoginFlowPage() {
  const [id, setId] = useState('admin');
  const [password, setPassword] = useState('1234');
  const [pending, setPending] = useState(false);
  const authState = useAuthState();
  const authDispatch = useAuthDispatch();
  const { beginTraceSession, captureStateDiff, refreshRuntimeSnapshot } = useRuntime();

  useEffect(() => {
    addLog('Mount', 'LoginFlowPage mounted');
    addFlowStep('LoginFlowPage mounted');
    addLog('Render', 'LoginFlowPage rendered login simulator');
    addFlowStep('Login form ready for interaction');
    refreshRuntimeSnapshot();
  }, [refreshRuntimeSnapshot]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    const beforeState = authState;

    beginTraceSession('Login', 'handleSubmit()', [
      'LoginFlowPage.handleSubmit',
      'authApi.login',
      'axiosClient.post',
      'mockServer.request',
      'dispatch(LOGIN_SUCCESS | LOGOUT)',
      'authReducer',
    ]);

    authApi
      .login({ id, password })
      .then((response) => {
        addLog('Dispatch', 'dispatch(LOGIN_SUCCESS)');
        addFlowStep('dispatch LOGIN_SUCCESS');
        authDispatch({ type: LOGIN_SUCCESS, payload: { userInfo: response.data, message: response.message } });
        addFlowStep('authReducer updates AuthState');
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
        addLog('Dispatch', 'dispatch(LOGOUT) after login failure');
        addFlowStep('dispatch LOGOUT after login failure');
        authDispatch({ type: LOGOUT, payload: { error: error.response?.message ?? 'login failed' } });
        addFlowStep('authReducer clears AuthState');
        captureStateDiff(beforeState, {
          isLogin: false,
          userInfo: null,
          authChecked: true,
          loading: false,
          error: error.response?.message ?? 'login failed',
          message: null,
        });
      })
      .finally(() => {
        setPending(false);
        addLog('Render', 'LoginFlowPage rerendered after AuthState update');
        addFlowStep('rerender complete');
        refreshRuntimeSnapshot();
      });
  };

  const handleLogout = () => {
    setPending(true);
    const beforeState = authState;

    beginTraceSession('Logout', 'handleLogout()', [
      'LoginFlowPage.handleLogout',
      'authApi.logout',
      'axiosClient.post',
      'mockServer.request',
      'dispatch(LOGOUT)',
      'authReducer',
    ]);

    authApi.logout().finally(() => {
      addLog('Dispatch', 'dispatch(LOGOUT) from LoginFlowPage');
      addFlowStep('dispatch LOGOUT from LoginFlowPage');
      authDispatch({ type: LOGOUT, payload: { message: 'manual logout complete' } });
      addFlowStep('authReducer clears AuthState');
      captureStateDiff(beforeState, {
        isLogin: false,
        userInfo: null,
        authChecked: true,
        loading: false,
        error: null,
        message: 'manual logout complete',
      });
      setPending(false);
      addLog('Render', 'LoginFlowPage rerendered after logout');
      addFlowStep('rerender complete');
      refreshRuntimeSnapshot();
    });
  };

  const runRestoreExample = () => {
    const beforeState = authState;
    const restoredState = {
      ...beforeState,
      isLogin: true,
      userInfo: { id: 'restored-user', name: 'Restored User' },
      authChecked: true,
      loading: false,
      error: null,
      message: 'manual restore sample',
    };

    beginTraceSession('Manual AUTH_RESTORE', 'restore sample clicked', [
      'LoginFlowPage.runRestoreExample',
      'dispatch(AUTH_RESTORE)',
      'authReducer',
    ]);
    addLog('Dispatch', 'dispatch(AUTH_RESTORE) sample restore');
    addFlowStep('manual AUTH_RESTORE sample');
    authDispatch({
      type: AUTH_RESTORE,
      payload: { userInfo: { id: 'restored-user', name: 'Restored User' }, message: 'manual restore sample' },
    });
    addFlowStep('authReducer updates AuthState');
    captureStateDiff(beforeState, restoredState);
    addLog('Render', 'LoginFlowPage rerendered after manual restore');
    addFlowStep('rerender complete');
    refreshRuntimeSnapshot();
  };

  return (
    <main className="login-flow-page">
      <section className="chapter-heading">
        <div>
          <h1>Chapter 2 - Login Flow</h1>
          <p>Click login and watch Context, reducer, API, mock server, and rerender lifecycle move together.</p>
        </div>
      </section>

      <section className="runtime-monitor-layout">
        <aside className="mini-action-column">
          <section className="panel mini-action-panel">
            <div className="panel-title">Mini Action Panel</div>
            <form className="mini-stack" onSubmit={handleSubmit}>
              <label>
                ID
                <input value={id} onChange={(event) => setId(event.target.value)} />
              </label>
              <label>
                Password
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
              </label>
              <div className="button-row vertical">
                <button type="submit" disabled={pending}>
                  {pending ? 'Running...' : 'Login'}
                </button>
                <button type="button" onClick={handleLogout} disabled={pending || !authState.isLogin}>
                  Logout
                </button>
                <button type="button" onClick={runRestoreExample} disabled={pending}>
                  Restore sample
                </button>
              </div>
            </form>
          </section>

          <section className="panel learning-notes-panel compact">
            <div className="panel-title">Click Anatomy</div>
            <div className="learning-notes">
              <p>
                Component: <code>src/pages/LoginFlowPage.tsx</code>
              </p>
              <p>
                API: <code>src/api/authApi.ts</code>
              </p>
              <p>
                Reducer: <code>src/reducers/authReducer.ts</code>
              </p>
              <p>
                Path: <code>handleSubmit -&gt; authApi.login -&gt; axiosClient.post -&gt; mockServer.request -&gt; dispatch -&gt; authReducer -&gt; rerender</code>
              </p>
              <p>
                Mock: <code>?mock=login:200:login-complete</code> or <code>?mock=login:404:login-failed</code>
              </p>
            </div>
          </section>
        </aside>

        <section className="runtime-monitoring-area">
          <TraceSessionViewer />
          <div className="trace-api-grid">
            <ApiActivityList />
            <ApiDetailInspector />
          </div>
          <div className="trace-bottom-grid">
            <StateDiffViewer />
            <CallStackViewer />
          </div>
          <RawConsoleDrawer />
        </section>
      </section>
    </main>
  );
}
