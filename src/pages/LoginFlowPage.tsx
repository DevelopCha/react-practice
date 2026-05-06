import { FormEvent, useEffect, useState } from 'react';
import { authApi } from '../api/authApi';
import { TraceMonitorLayout } from '../components/TraceMonitorLayout';
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
  const { beginTraceSession, captureStateDiff, observe, refreshRuntimeSnapshot } = useRuntime();

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
    ], { id, password: password ? '***' : '' });
    observe('input_collect', { id, password: password ? '***' : '' }, {
      label: '입력값 수집',
      meaning: '사용자가 Input Lab에서 수정한 form state를 이번 Login Session의 출발점으로 고정합니다.',
      codeLocation: 'src/pages/LoginFlowPage.tsx:39',
    });
    // 현실적인 로그인 흐름에서는 화면 form state를 그대로 보내지 않고,
    // API 함수가 이해할 수 있는 request payload로 정리한 뒤 요청한다.
    observe('payload_build', { requestPayload: { id, password: password ? '***' : '' } }, {
      label: 'payload 생성',
      meaning: '화면 입력값을 authApi.login에 전달할 서버 요청용 payload로 정리합니다.',
      codeLocation: 'src/api/authApi.ts:13',
    });

    authApi
      .login({ id, password })
      .then((response) => {
        observe('response_transform', { rawResponse: response, reducerPayload: { userInfo: response.data, message: response.message } }, {
          label: '응답을 reducer payload로 변환',
          meaning: 'API 응답의 data와 message를 Context 상태가 이해할 수 있는 action payload로 정리합니다.',
          codeLocation: 'src/api/authApi.ts:13 -> src/reducers/authReducer.ts:20',
        });
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
        }, 'LOGIN_SUCCESS dispatch completed. isLogin, userInfo, authChecked가 로그인 성공 상태로 변경됩니다.');
      })
      .catch((error: MockServerFailure) => {
        observe('login_failure', { error: error.response ?? { message: 'login failed' } }, {
          label: '로그인 실패 응답 처리',
          meaning: '실패 응답은 LOGOUT action payload로 바뀌며 인증 상태를 안전하게 익명 상태로 되돌립니다.',
          codeLocation: 'src/pages/LoginFlowPage.tsx:75',
        });
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
        }, 'LOGOUT dispatch completed after login failure. error가 채워지고 userInfo는 비워집니다.');
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
    ], { currentUser: authState.userInfo?.id ?? null });

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
      }, 'LOGOUT dispatch completed. 로그인 사용자 정보가 제거되고 익명 Session으로 돌아갑니다.');
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
    ], { sampleUserId: 'restored-user' });
    observe('manual_restore_payload', { userInfo: restoredState.userInfo, message: restoredState.message }, {
      label: 'AUTH_RESTORE payload 생성',
          meaning: '세션 확인 성공 응답을 인증 Context가 복원할 수 있는 reducer payload로 바꿉니다.',
          codeLocation: 'src/reducers/authReducer.ts:19',
    });
    addLog('Dispatch', 'dispatch(AUTH_RESTORE) sample restore');
    addFlowStep('manual AUTH_RESTORE sample');
    authDispatch({
      type: AUTH_RESTORE,
      payload: { userInfo: { id: 'restored-user', name: 'Restored User' }, message: 'manual restore sample' },
    });
    addFlowStep('authReducer updates AuthState');
    captureStateDiff(beforeState, restoredState, 'AUTH_RESTORE dispatch completed. 익명 상태에서 복원된 로그인 상태로 이동합니다.');
    addLog('Render', 'LoginFlowPage rerendered after manual restore');
    addFlowStep('rerender complete');
    refreshRuntimeSnapshot();
  };

  return (
    <TraceMonitorLayout
      title="Chapter 2 - Login Flow"
      subtitle="Click login and watch Context, reducer, API, mock server, and rerender lifecycle move together."
      rawState={authState}
      rawStateLabel="AuthContext"
      apiLabKeys={['login', 'logout']}
      processGuide={
        <>
          <p>로그인은 단순 버튼 클릭이 아니라 입력 검증, 요청 payload 생성, 응답 해석, 인증 상태 반영으로 이어지는 업무 흐름이다.</p>
          <ol>
            <li><strong>입력값 수집</strong>: controlled input의 현재 값을 하나의 실행 입력으로 고정한다.</li>
            <li><strong>payload 생성</strong>: 화면 상태를 API가 받을 request shape로 정리한다.</li>
            <li><strong>LOGIN_SUCCESS/LOGOUT</strong>: 응답 결과에 따라 인증 Context를 성공 또는 실패 상태로 갱신한다.</li>
          </ol>
        </>
      }
      actionPanel={
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
      }
      notes={
        <>
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
        </>
      }
    />
  );
}
