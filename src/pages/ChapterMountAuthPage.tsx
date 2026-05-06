import { useEffect, useState } from 'react';
import { authApi } from '../api/authApi';
import { TraceMonitorLayout } from '../components/TraceMonitorLayout';
import { useAuthDispatch, useAuthState } from '../context/AuthContext';
import { useCommon } from '../context/CommonContext';
import { AUTH_RESTORE, LOGOUT } from '../reducers/authActionTypes';
import { addFlowStep } from '../runtime/flowTracker';
import { addLog } from '../runtime/logger';
import { useRuntime } from '../runtime/RuntimeContext';
import { sleep } from '../runtime/sleep';
import type { MockServerFailure } from '../runtime/mockServer';
import type { FlowStep } from '../types/runtime';

const authCheckPreviewSteps: FlowStep[] = [
  {
    id: 'auth-preview-1',
    label: 'handleAuthCheck()',
    meaning: '사용자가 Auth Check 실험을 시작하는 클릭 핸들러입니다.',
    codeLocation: 'src/pages/ChapterMountAuthPage.tsx:23',
  },
  {
    id: 'auth-preview-2',
    label: 'auth initialization effect simulated',
    meaning: '앱 mount 시 실행되는 인증 초기화 effect를 수동으로 재현합니다.',
    codeLocation: 'src/pages/ChapterMountAuthPage.tsx:35',
  },
  {
    id: 'auth-preview-3',
    label: 'Auth Check 요청 준비',
    meaning: '앱 시작 시 기존 세션이 있는지 확인하기 위한 mock API 요청을 구성합니다.',
    codeLocation: 'src/api/authApi.ts:8',
  },
  {
    id: 'auth-preview-4',
    label: 'authApi.checkAuth()',
    meaning: '인증 세션 복원을 위해 auth API 함수를 호출합니다.',
    codeLocation: 'src/api/authApi.ts:7',
  },
  {
    id: 'auth-preview-5',
    label: 'axiosClient.get(auth)',
    meaning: 'GET 요청을 API monitor에 등록하고 mock server로 전달합니다.',
    codeLocation: 'src/api/axiosClient.ts:14',
  },
  {
    id: 'auth-preview-6',
    label: 'mockServer.request(auth)',
    meaning: 'mock 설정과 API Lab override를 적용해 응답을 예약합니다.',
    codeLocation: 'src/runtime/mockServer.ts:36',
  },
  {
    id: 'auth-preview-7',
    label: 'mockServer resolved auth',
    meaning: '성공 응답을 resolve하고 response data를 다음 단계로 넘깁니다.',
    codeLocation: 'src/runtime/mockServer.ts:52',
  },
  {
    id: 'auth-preview-8',
    label: 'AUTH_RESTORE payload 생성',
    meaning: '세션 확인 성공 응답을 인증 Context가 복원할 수 있는 reducer payload로 바꿉니다.',
    codeLocation: 'src/reducers/authReducer.ts:19',
  },
  {
    id: 'auth-preview-9',
    label: 'dispatch AUTH_RESTORE',
    meaning: '복원된 사용자 정보를 AuthContext reducer로 전달합니다.',
    codeLocation: 'src/pages/ChapterMountAuthPage.tsx:55',
  },
  {
    id: 'auth-preview-10',
    label: 'authReducer restores session',
    meaning: 'reducer 결과로 로그인 상태가 Context에 반영됩니다.',
    codeLocation: 'src/reducers/authReducer.ts:20',
  },
  {
    id: 'auth-preview-11',
    label: 'Header rerender complete',
    meaning: 'Context 상태 변경 후 Header와 화면이 최신 인증 상태로 다시 그려집니다.',
    codeLocation: 'src/pages/ChapterMountAuthPage.tsx:88',
  },
];

export function ChapterMountAuthPage() {
  const [pending, setPending] = useState(false);
  const authState = useAuthState();
  const authDispatch = useAuthDispatch();
  const { setActiveChapter } = useCommon();
  const {
    beginTraceSession,
    captureStateDiff,
    completeTraceSession,
    observe,
    setPreviewFlowSteps,
  } = useRuntime();

  useEffect(() => {
    setActiveChapter('Chapter 1 - App Mount & Auth Check');
    setPreviewFlowSteps(authCheckPreviewSteps);
  }, [setActiveChapter, setPreviewFlowSteps]);

  const runAuthCheck = async () => {
    const beforeState = authState;
    let sessionResult = 'Auth Check 완료';
    setPending(true);
    beginTraceSession('Auth Check', 'handleAuthCheck()', [
      'ChapterMountAuthPage.handleAuthCheck',
      'authApi.checkAuth',
      'axiosClient.get',
      'mockServer.request',
      'dispatch(AUTH_RESTORE | LOGOUT)',
      'authReducer',
    ], { currentAuthChecked: authState.authChecked, currentUser: authState.userInfo?.id ?? null }, {
      meaning: '사용자가 Auth Check 실험을 시작하는 클릭 핸들러입니다.',
      codeLocation: 'src/pages/ChapterMountAuthPage.tsx:23',
    });
    await sleep();

    addLog('Effect', 'manual auth initialization started');
    addFlowStep('auth initialization effect simulated', {
      meaning: '앱 mount 시 실행되는 인증 초기화 effect를 수동으로 재현합니다.',
      codeLocation: 'src/pages/ChapterMountAuthPage.tsx:35',
    });
    await sleep();

    // 앱 시작 시 인증 복원은 실제 서비스에서도 자주 등장하는 초기화 프로세스다.
    // 이 단계는 "기존 세션을 믿어도 되는가?"를 API로 확인하는 역할을 한다.
    observe('auth_check_request', { apiKey: 'auth', fallbackUser: { id: 'admin', name: 'Legacy Admin' } }, {
      label: 'Auth Check 요청 준비',
      meaning: '앱 시작 시 기존 세션이 있는지 확인하기 위한 mock API 요청을 구성합니다.',
      codeLocation: 'src/api/authApi.ts:8',
    });
    await sleep();

    try {
      const response = await authApi.checkAuth();
      await sleep();

      observe('auth_restore_payload', { rawResponse: response, reducerPayload: { userInfo: response.data, message: response.message } }, {
        label: 'AUTH_RESTORE payload 생성',
        meaning: '세션 확인 성공 응답을 인증 Context가 복원할 수 있는 reducer payload로 바꿉니다.',
        codeLocation: 'src/reducers/authReducer.ts:19',
      });
      await sleep();

      addLog('Dispatch', 'dispatch(AUTH_RESTORE)');
      addFlowStep('dispatch AUTH_RESTORE', {
        meaning: '복원된 사용자 정보를 AuthContext reducer로 전달합니다.',
        codeLocation: 'src/pages/ChapterMountAuthPage.tsx:55',
      });
      await sleep();

      authDispatch({ type: AUTH_RESTORE, payload: { userInfo: response.data, message: response.message } });
      addFlowStep('authReducer restores session', {
        meaning: 'reducer 결과로 로그인 상태가 Context에 반영됩니다.',
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
      }, 'AUTH_RESTORE dispatch completed. 익명 상태에서 복원된 로그인 상태로 이동합니다.');
      sessionResult = `Auth Check 성공: ${response.data.id} 세션이 복원되었습니다.`;
      await sleep();
    } catch (error) {
      const failure = error as MockServerFailure;
      const errorMessage = failure.response?.message ?? 'auth check failed';

      addLog('Dispatch', 'dispatch(LOGOUT) fallback');
      addFlowStep('dispatch LOGOUT fallback', {
        meaning: '세션 확인 실패를 익명 상태 전환 action으로 처리합니다.',
        codeLocation: 'src/pages/ChapterMountAuthPage.tsx:71',
      });
      await sleep();

      authDispatch({ type: LOGOUT, payload: { error: errorMessage } });
      addFlowStep('authReducer marks authChecked fallback', {
        meaning: '인증 확인은 끝났지만 로그인 세션은 없는 상태로 정리합니다.',
        codeLocation: 'src/reducers/authReducer.ts:42',
      });
      captureStateDiff(beforeState, {
        isLogin: false,
        userInfo: null,
        authChecked: true,
        loading: false,
        error: errorMessage,
        message: null,
      }, 'LOGOUT fallback dispatch completed. 인증 확인은 끝났지만 유효한 세션은 없는 상태입니다.');
      sessionResult = `Auth Check 실패: ${errorMessage}`;
      await sleep();
    } finally {
      addLog('Render', 'Header rerendered from AuthContext update');
      addFlowStep('Header rerender complete', {
        meaning: 'Context 상태 변경 후 Header와 화면이 최신 인증 상태로 다시 그려집니다.',
        codeLocation: 'src/pages/ChapterMountAuthPage.tsx:88',
      });
      await sleep();
      completeTraceSession(sessionResult);
      setPending(false);
    }
  };

  return (
    <TraceMonitorLayout
      title="Chapter 1 - App Mount & Auth Check"
      subtitle="Run the startup auth restoration lifecycle as a focused trace session."
      rawState={authState}
      rawStateLabel="AuthContext"
      apiLabKeys={['auth']}
      processGuide={
        <>
          <p>실제 앱은 첫 화면을 보여주기 전에 기존 세션을 확인한다. 이 과정은 보안과 사용자 경험을 동시에 결정한다.</p>
          <ol>
            <li><strong>세션 확인 요청</strong>: 저장된 로그인 상태를 그대로 믿지 않고 서버에 검증한다.</li>
            <li><strong>AUTH_RESTORE</strong>: 유효한 세션이면 Context 상태를 로그인 상태로 복원한다.</li>
            <li><strong>LOGOUT fallback</strong>: 실패하면 인증 확인은 끝내되 익명 상태로 안전하게 전환한다.</li>
          </ol>
        </>
      }
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
