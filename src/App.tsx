import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { authApi } from './api/authApi';
import { Header } from './components/Header';
import { useAuthDispatch } from './context/AuthContext';
import { DashboardPage } from './pages/DashboardPage';
import { ChapterListPage } from './pages/ChapterListPage';
import { ChapterMountAuthPage } from './pages/ChapterMountAuthPage';
import { ChapterMutationPage } from './pages/ChapterMutationPage';
import { LoginFlowPage } from './pages/LoginFlowPage';
import { AUTH_RESTORE, LOGOUT } from './reducers/authActionTypes';
import { addFlowStep } from './runtime/flowTracker';
import { addLog } from './runtime/logger';
import { useRuntime } from './runtime/RuntimeContext';
import type { MockServerFailure } from './runtime/mockServer';

export function App() {
  const authDispatch = useAuthDispatch();
  const { refreshRuntimeSnapshot } = useRuntime();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    addLog('Mount', 'App mounted');
    addFlowStep('App mounted');
    addLog('Effect', 'App useEffect auth initialization');
    addFlowStep('useEffect auth initialization');
    refreshRuntimeSnapshot();

    authApi
      .checkAuth()
      .then((response) => {
        addLog('Dispatch', 'dispatch(AUTH_RESTORE)');
        addFlowStep('dispatch AUTH_RESTORE');
        authDispatch({ type: AUTH_RESTORE, payload: { userInfo: response.data, message: response.message } });
      })
      .catch((error: MockServerFailure) => {
        addLog('Dispatch', 'dispatch(LOGOUT)');
        addFlowStep('dispatch LOGOUT fallback');
        authDispatch({ type: LOGOUT, payload: { error: error.response?.message ?? 'auth check failed' } });
      })
      .finally(() => {
        addLog('Render', 'Auth state changed and App/Header rerendered');
        addFlowStep('Auth state visible in dashboard');
        refreshRuntimeSnapshot();
        setInitializing(false);
      });
  }, [authDispatch, refreshRuntimeSnapshot]);

  return (
    <div className={initializing ? 'app-shell app-shell-loading' : 'app-shell'} aria-busy={initializing}>
      <Header />
      <Routes>
        <Route path="/" element={<DashboardPage />} />
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
