import { FormEvent, useEffect, useState } from 'react';
import { authApi } from '../api/authApi';
import { TraceMonitorLayout } from '../components/TraceMonitorLayout';
import { useAuthDispatch, useAuthState } from '../context/AuthContext';
import { useCommon } from '../context/CommonContext';
import { AUTH_RESTORE, LOGIN_SUCCESS, LOGOUT } from '../reducers/authActionTypes';
import { addFlowStep } from '../runtime/flowTracker';
import { addLog } from '../runtime/logger';
import { sleep } from '../runtime/sleep';
import { useRuntime } from '../runtime/RuntimeContext';
import type { MockServerFailure } from '../runtime/mockServer';
import type { FlowStep } from '../types/runtime';

const loginPreviewSteps: FlowStep[] = [
  {
    id: 'login-preview-1',
    label: 'handleSubmit()',
    meaning: '사용자가 로그인 실험을 시작하는 submit 핸들러입니다.',
    codeLocation: 'src/pages/LoginFlowPage.tsx:60',
  },
  {
    id: 'login-preview-2',
    label: '입력값 수집',
    meaning: '현재 ID와 Password 값을 이번 Login Session의 고정 입력값으로 기록합니다.',
    codeLocation: 'src/pages/LoginFlowPage.tsx:72',
  },
  {
    id: 'login-preview-3',
    label: 'payload 생성',
    meaning: '폼 값을 authApi.login이 사용할 서버 요청용 payload로 정리합니다.',
    codeLocation: 'src/api/authApi.ts:13',
  },
  {
    id: 'login-preview-4',
    label: 'authApi.login()',
    meaning: '로그인 API 함수를 호출해 mock server까지 요청 흐름을 시작합니다.',
    codeLocation: 'src/api/authApi.ts:14',
  },
  {
    id: 'login-preview-5',
    label: '응답을 reducer payload로 변환',
    meaning: '응답 결과를 AuthContext가 이해할 action payload로 바꿉니다.',
    codeLocation: 'src/reducers/authReducer.ts:20',
  },
  {
    id: 'login-preview-6',
    label: 'dispatch LOGIN_SUCCESS',
    meaning: '로그인 성공 결과를 AuthContext reducer로 전달합니다.',
    codeLocation: 'src/pages/LoginFlowPage.tsx:94',
  },
  {
    id: 'login-preview-7',
    label: 'authReducer updates AuthState',
    meaning: '인증 상태가 로그인 성공 또는 실패 결과로 갱신됩니다.',
    codeLocation: 'src/reducers/authReducer.ts:20',
  },
  {
    id: 'login-preview-8',
    label: 'rerender complete',
    meaning: 'AuthContext 변경 결과가 Header와 페이지에 다시 반영됩니다.',
    codeLocation: 'src/pages/LoginFlowPage.tsx:132',
  },
];

export function LoginFlowPage() {
  const [id, setId] = useState('admin');
  const [password, setPassword] = useState('1234');
  const [pending, setPending] = useState(false);
  const authState = useAuthState();
  const authDispatch = useAuthDispatch();
  const { setActiveChapter } = useCommon();
  const { beginTraceSession, captureStateDiff, completeTraceSession, observe, refreshRuntimeSnapshot, setPreviewFlowSteps } = useRuntime();

  useEffect(() => {
    setActiveChapter('rl001 · Login Flow');
    setPreviewFlowSteps(loginPreviewSteps);
  }, [setActiveChapter, setPreviewFlowSteps]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    const beforeState = authState;
    let sessionResult = 'Login 실험 완료';
    setPreviewFlowSteps(loginPreviewSteps);
    beginTraceSession('Login', 'handleSubmit()', [
      'LoginFlowPage.handleSubmit',
      'authApi.login',
      'axiosClient.post',
      'mockServer.request',
      'dispatch(LOGIN_SUCCESS | LOGOUT)',
      'authReducer',
    ], { id, password: password ? '***' : '' }, {
      meaning: '사용자가 로그인 실험을 시작하는 submit 핸들러입니다.',
      codeLocation: 'src/pages/LoginFlowPage.tsx:60',
    });
    await sleep();

    observe('input_collect', { id, password: password ? '***' : '' }, {
      label: '입력값 수집',
      meaning: '사용자가 Input Lab에서 수정한 form state를 이번 Login Session의 출발점으로 고정합니다.',
      codeLocation: 'src/pages/LoginFlowPage.tsx:72',
    });
    await sleep();

    // 현실적인 로그인 흐름에서는 화면 form state를 그대로 보내지 않고,
    // API 함수가 이해할 수 있는 request payload로 정리한 뒤 요청한다.
    observe('payload_build', { requestPayload: { id, password: password ? '***' : '' } }, {
      label: 'payload 생성',
      meaning: '화면 입력값을 authApi.login에 전달할 서버 요청용 payload로 정리합니다.',
      codeLocation: 'src/api/authApi.ts:13',
    });
    await sleep();

    authApi
      .login({ id, password })
      .then((response) => {
        observe('response_transform', { rawResponse: response, reducerPayload: { userInfo: response.data, message: response.message } }, {
          label: '응답을 reducer payload로 변환',
          meaning: 'API 응답의 data와 message를 Context 상태가 이해할 수 있는 action payload로 정리합니다.',
          codeLocation: 'src/reducers/authReducer.ts:20',
        });
        addLog('Dispatch', 'dispatch(LOGIN_SUCCESS)');
        addFlowStep('dispatch LOGIN_SUCCESS', {
          meaning: '로그인 성공 결과를 AuthContext reducer로 전달합니다.',
          data: {
            asIs: {
              isLogin: beforeState.isLogin,
              userInfo: beforeState.userInfo,
              authChecked: beforeState.authChecked,
            },
            toBe: {
              type: LOGIN_SUCCESS,
              payload: { userInfo: response.data, message: response.message },
            },
            reason: '로그인 성공 응답을 reducer action으로 전달합니다.',
          },
          codeLocation: 'src/pages/LoginFlowPage.tsx:94',
        });
        authDispatch({ type: LOGIN_SUCCESS, payload: { userInfo: response.data, message: response.message } });
        addFlowStep('authReducer updates AuthState', {
          meaning: 'isLogin, userInfo, authChecked가 로그인 성공 상태로 갱신됩니다.',
          data: {
            asIs: {
              isLogin: beforeState.isLogin,
              userInfo: beforeState.userInfo,
              authChecked: beforeState.authChecked,
              error: beforeState.error,
            },
            toBe: {
              isLogin: true,
              userInfo: response.data,
              authChecked: true,
              error: null,
              message: response.message,
            },
            reason: '로그인 성공 후 인증 상태를 사용자 정보 기준으로 갱신합니다.',
          },
          codeLocation: 'src/reducers/authReducer.ts:20',
        });
        captureStateDiff(beforeState, {
          ...beforeState,
          isLogin: true,
          userInfo: response.data,
          authChecked: true,
          loading: false,
          error: null,
          message: response.message,
        }, 'LOGIN_SUCCESS dispatch completed. isLogin, userInfo, authChecked가 로그인 성공 상태로 변경됩니다.');
        sessionResult = `Login 성공: ${response.data.id} 사용자가 인증 상태로 전환되었습니다.`;
      })
      .catch((error: MockServerFailure) => {
        observe('login_failure', { error: error.response ?? { message: 'login failed' } }, {
          label: '로그인 실패 응답 처리',
          meaning: '실패 응답은 LOGOUT action payload로 바뀌며 인증 상태를 안전하게 익명 상태로 되돌립니다.',
          codeLocation: 'src/pages/LoginFlowPage.tsx:112',
        });
        addLog('Dispatch', 'dispatch(LOGOUT) after login failure');
        addFlowStep('dispatch LOGOUT after login failure', {
          meaning: '로그인 실패 결과를 익명 상태 전환 action으로 처리합니다.',
          data: {
            asIs: {
              isLogin: beforeState.isLogin,
              userInfo: beforeState.userInfo,
            },
            toBe: {
              type: LOGOUT,
              payload: { error: error.response?.message ?? 'login failed' },
            },
            reason: '실패 응답은 세션을 유지하지 않고 guest 상태로 되돌립니다.',
          },
          codeLocation: 'src/pages/LoginFlowPage.tsx:117',
        });
        authDispatch({ type: LOGOUT, payload: { error: error.response?.message ?? 'login failed' } });
        addFlowStep('authReducer clears AuthState', {
          meaning: '로그인 실패 시 userInfo는 제거되고 error 상태가 채워집니다.',
          data: {
            asIs: {
              isLogin: beforeState.isLogin,
              userInfo: beforeState.userInfo,
              error: beforeState.error,
            },
            toBe: {
              isLogin: false,
              userInfo: null,
              error: error.response?.message ?? 'login failed',
            },
            reason: '실패 응답을 인증 실패 상태로 반영합니다.',
          },
          codeLocation: 'src/reducers/authReducer.ts:42',
        });
        captureStateDiff(beforeState, {
          isLogin: false,
          userInfo: null,
          authChecked: true,
          loading: false,
          error: error.response?.message ?? 'login failed',
          message: null,
        }, 'LOGOUT dispatch completed after login failure. error가 채워지고 userInfo는 비워집니다.');
        sessionResult = `Login 실패: ${error.response?.message ?? 'login failed'}`;
      })
      .finally(() => {
        setPending(false);
        addLog('Render', 'LoginFlowPage rerendered after AuthState update');
        addFlowStep('rerender complete', {
          meaning: 'AuthContext 상태 변경이 Header와 로그인 화면에 다시 반영됩니다.',
          codeLocation: 'src/pages/LoginFlowPage.tsx:132',
        });
        refreshRuntimeSnapshot();
        completeTraceSession(sessionResult);
      });
  };

  const handleLogout = async () => {
    setPending(true);
    const beforeState = authState;
    let sessionResult = 'Logout 실험 완료';
    beginTraceSession('Logout', 'handleLogout()', [
      'LoginFlowPage.handleLogout',
      'authApi.logout',
      'axiosClient.post',
      'mockServer.request',
      'dispatch(LOGOUT)',
      'authReducer',
    ], { currentUser: authState.userInfo?.id ?? null }, {
      meaning: '현재 로그인된 사용자를 명시적으로 로그아웃하는 세션입니다.',
      codeLocation: 'src/pages/LoginFlowPage.tsx:141',
    });
    await sleep();

    authApi.logout().finally(async () => {
      addLog('Dispatch', 'dispatch(LOGOUT) from LoginFlowPage');
      addFlowStep('dispatch LOGOUT from LoginFlowPage', {
        meaning: '로그아웃 완료 후 AuthContext를 익명 상태로 초기화합니다.',
        data: {
          asIs: {
            isLogin: beforeState.isLogin,
            userInfo: beforeState.userInfo,
          },
          toBe: {
            type: LOGOUT,
            payload: { message: 'manual logout complete' },
          },
          reason: '사용자 요청으로 세션을 명시적으로 종료합니다.',
        },
        codeLocation: 'src/pages/LoginFlowPage.tsx:157',
      });
      authDispatch({ type: LOGOUT, payload: { message: 'manual logout complete' } });
      addFlowStep('authReducer clears AuthState', {
        meaning: '로그아웃 시 userInfo는 제거되고 guest 세션으로 돌아갑니다.',
        data: {
          asIs: {
            isLogin: beforeState.isLogin,
            userInfo: beforeState.userInfo,
            message: beforeState.message,
          },
          toBe: {
            isLogin: false,
            userInfo: null,
            message: 'manual logout complete',
          },
          reason: '로그아웃 후 guest 세션으로 전환합니다.',
        },
        codeLocation: 'src/reducers/authReducer.ts:42',
      });
      captureStateDiff(beforeState, {
        isLogin: false,
        userInfo: null,
        authChecked: true,
        loading: false,
        error: null,
        message: 'manual logout complete',
      }, 'LOGOUT dispatch completed. 로그인 사용자 정보가 제거되고 익명 Session으로 돌아갑니다.');
      sessionResult = 'Logout 완료: 인증 상태가 guest 세션으로 초기화되었습니다.';
      setPending(false);
      addLog('Render', 'LoginFlowPage rerendered after logout');
      addFlowStep('rerender complete', {
        meaning: '로그아웃 결과가 Header와 로그인 화면에 다시 반영됩니다.',
        codeLocation: 'src/pages/LoginFlowPage.tsx:173',
      });
      await sleep();
      refreshRuntimeSnapshot();
      completeTraceSession(sessionResult);
    });
  };

  const runRestoreExample = async () => {
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
    ], { sampleUserId: 'restored-user' }, {
      meaning: '학습용으로 AUTH_RESTORE action만 단독 실행해보는 수동 복원 실험입니다.',
      codeLocation: 'src/pages/LoginFlowPage.tsx:179',
    });
    await sleep();
    observe('manual_restore_payload', { userInfo: restoredState.userInfo, message: restoredState.message }, {
      label: 'AUTH_RESTORE payload 생성',
      meaning: '복원할 사용자 정보를 AuthContext가 이해할 payload 형태로 구성합니다.',
      codeLocation: 'src/reducers/authReducer.ts:19',
    });
    await sleep();
    addLog('Dispatch', 'dispatch(AUTH_RESTORE) sample restore');
    addFlowStep('manual AUTH_RESTORE sample', {
      meaning: '세션 복원 action만 따로 실행해 reducer와 화면 변화를 확인합니다.',
      data: {
        asIs: {
          isLogin: beforeState.isLogin,
          userInfo: beforeState.userInfo,
        },
        toBe: {
          type: AUTH_RESTORE,
          payload: { userInfo: restoredState.userInfo, message: restoredState.message },
        },
        reason: '학습용으로 AUTH_RESTORE만 단독 실행합니다.',
      },
      codeLocation: 'src/pages/LoginFlowPage.tsx:193',
    });
    authDispatch({
      type: AUTH_RESTORE,
      payload: { userInfo: { id: 'restored-user', name: 'Restored User' }, message: 'manual restore sample' },
    });
    addFlowStep('authReducer updates AuthState', {
      meaning: '익명 상태가 복원된 로그인 상태로 전환됩니다.',
      data: {
        asIs: {
          isLogin: beforeState.isLogin,
          userInfo: beforeState.userInfo,
        },
        toBe: {
          isLogin: true,
          userInfo: restoredState.userInfo,
          message: restoredState.message,
        },
        reason: '복원 action 결과를 인증 상태에 반영합니다.',
      },
      codeLocation: 'src/reducers/authReducer.ts:20',
    });
    captureStateDiff(beforeState, restoredState, 'AUTH_RESTORE dispatch completed. 익명 상태에서 복원된 로그인 상태로 이동합니다.');
    addLog('Render', 'LoginFlowPage rerendered after manual restore');
    addFlowStep('rerender complete', {
      meaning: '복원된 인증 상태가 Header와 로그인 화면에 다시 반영됩니다.',
      codeLocation: 'src/pages/LoginFlowPage.tsx:201',
    });
    await sleep();
    refreshRuntimeSnapshot();
    completeTraceSession('Manual AUTH_RESTORE 완료: 복원 action만 단독으로 실험했습니다.');
  };

  return (
    <TraceMonitorLayout
      title="rl001 · Login Flow"
      subtitle="Run a focused login session and inspect input, payload, auth API, reducer, and rerender decisions."
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
                Index: <code>rl001</code>
              </p>
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
