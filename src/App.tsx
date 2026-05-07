import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { authApi } from './api/authApi';
import { Header } from './components/Header';
import { useAuthDispatch } from './context/AuthContext';
import { DashboardPage } from './pages/DashboardPage';
import { ChapterListPage } from './pages/ChapterListPage';
import { ChapterMountAuthPage } from './pages/ChapterMountAuthPage';
import { ChapterMutationPage } from './pages/ChapterMutationPage';
import { LoginFlowPage } from './pages/LoginFlowPage';
import { ReactTrackGroupPage } from './pages/ReactTrackGroupPage';
import { AUTH_RESTORE, LOGOUT } from './reducers/authActionTypes';
import { addFlowStep } from './runtime/flowTracker';
import { addLog } from './runtime/logger';
import { runWithRuntimeInstrumentationSuppressed } from './runtime/traceGate';
import { useRuntime } from './runtime/RuntimeContext';
import type { MockServerFailure } from './runtime/mockServer';

export function App() {
  const authDispatch = useAuthDispatch();
  const { refreshRuntimeSnapshot } = useRuntime();
  const [initializing, setInitializing] = useState(true);
  const location = useLocation();
  const traceAppInit = location.pathname === '/';

  useEffect(() => {
    if (traceAppInit) {
      addLog('Mount', 'App mounted');
      addFlowStep('App mounted');
      addLog('Effect', 'App useEffect auth initialization');
      addFlowStep('useEffect auth initialization');
      refreshRuntimeSnapshot();
    }

    const authCheckPromise = traceAppInit
      ? authApi.checkAuth()
      : runWithRuntimeInstrumentationSuppressed(() => authApi.checkAuth());

    authCheckPromise
      .then((response) => {
        if (traceAppInit) {
          addLog('Dispatch', 'dispatch(AUTH_RESTORE)');
          addFlowStep('dispatch AUTH_RESTORE');
        }
        authDispatch({ type: AUTH_RESTORE, payload: { userInfo: response.data, message: response.message } });
      })
      .catch((error: MockServerFailure) => {
        if (traceAppInit) {
          addLog('Dispatch', 'dispatch(LOGOUT)');
          addFlowStep('dispatch LOGOUT fallback');
        }
        authDispatch({ type: LOGOUT, payload: { error: error.response?.message ?? 'auth check failed' } });
      })
      .finally(() => {
        if (traceAppInit) {
          addLog('Render', 'Auth state changed and App/Header rerendered');
          addFlowStep('Auth state visible in dashboard');
          refreshRuntimeSnapshot();
        }
        setInitializing(false);
      });
  }, [authDispatch, refreshRuntimeSnapshot, traceAppInit]);

  return (
    <div className={initializing ? 'app-shell app-shell-loading' : 'app-shell'} aria-busy={initializing}>
      <Header />
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/track/react/:groupId" element={<ReactTrackGroupPage />} />
        <Route path="/chapter/mount-auth" element={<ChapterMountAuthPage />} />
        <Route path="/chapter/login" element={<LoginFlowPage />} />
        <Route path="/chapter/list" element={<ChapterListPage />} />
        <Route path="/chapter/mutation" element={<ChapterMutationPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {initializing && (
        <div className="app-loading-overlay" role="status" aria-live="polite">
          <div className="app-loading-box">
            <strong>Loading runtime...</strong>
            <span>초기 상태를 준비하는 중입니다.</span>
          </div>
        </div>
      )}
    </div>
  );
}
