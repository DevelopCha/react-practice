import { useEffect, useState } from 'react';
import { authApi } from '../api/authApi';
import { ExecutionRunModal } from '../components/ExecutionRunModal';
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
    data: {
      asIs: { sessionState: 'anonymous-or-restored', authChecked: false },
      toBe: { action: 'start auth check session' },
      reason: '이 버튼 클릭이 rc001 실험 전체의 시작점입니다.',
    },
    layer: 'Page',
    importance: 'core',
    breakpointTip: 'runAuthCheck 진입 직후. 현재 authState와 beginTraceSession input을 먼저 확인합니다.',
    changeSummary: '실험 세션이 시작되고 이후 단계들이 기록됩니다.',
    graphColumn: 0,
    graphRow: 1,
    codeLocation: 'src/pages/ChapterMountAuthPage.tsx:101',
  },
  {
    id: 'auth-preview-2',
    label: 'auth initialization effect simulated',
    meaning: '앱 mount 시 실행되는 인증 초기화 effect를 수동으로 재현합니다.',
    data: {
      asIs: { appState: 'before auth restore check' },
      toBe: { effect: 'manual auth initialization simulation' },
      reason: '실서비스에서 App mount 직후 일어나는 인증 확인 흐름을 재현합니다.',
    },
    layer: 'Effect',
    importance: 'support',
    breakpointTip: '초기화 effect 맥락을 따라갈 때만 봅니다. 핵심 원인 분석은 다음 API 단계가 더 중요합니다.',
    changeSummary: '앱 초기화 시점의 인증 확인 흐름으로 진입합니다.',
    graphColumn: 1,
    graphRow: 0,
    graphParents: ['auth-preview-1'],
    codeLocation: 'src/pages/ChapterMountAuthPage.tsx:118',
  },
  {
    id: 'auth-preview-3',
    label: 'Auth Check 요청 준비',
    meaning: '앱 시작 시 기존 세션이 있는지 확인하기 위한 mock API 요청을 구성합니다.',
    data: {
      asIs: { trustedSession: false },
      toBe: { request: { apiKey: 'auth', purpose: 'session verification' } },
      reason: '저장된 로그인 상태를 그대로 믿지 않고 서버 기준으로 검증합니다.',
    },
    layer: 'Page',
    importance: 'core',
    breakpointTip: 'API 호출 직전 request intent와 fallback user를 확인합니다.',
    changeSummary: '세션 검증용 auth 요청 정보가 준비됩니다.',
    graphColumn: 1,
    graphRow: 2,
    graphParents: ['auth-preview-2'],
    codeLocation: 'src/api/authApi.ts:8',
  },
  {
    id: 'auth-preview-4',
    label: 'authApi.checkAuth()',
    meaning: '인증 세션 복원을 위해 auth API 함수를 호출합니다.',
    data: {
      asIs: { authEndpointCalled: false },
      toBe: { authEndpointCalled: true },
      reason: '세션 복원 여부를 확인하는 실제 인증 API 호출 단계입니다.',
    },
    layer: 'API',
    importance: 'core',
    breakpointTip: 'authApi.checkAuth 진입점. Page 레이어에서 API 레이어로 책임이 넘어가는 순간입니다.',
    changeSummary: '인증 확인 API 호출이 시작됩니다.',
    graphColumn: 2,
    graphRow: 0,
    graphParents: ['auth-preview-3'],
    codeLocation: 'src/api/authApi.ts:7',
  },
  {
    id: 'auth-preview-5',
    label: 'axiosClient.get(auth)',
    meaning: 'GET 요청을 API monitor에 등록하고 mock server로 전달합니다.',
    data: {
      asIs: { requestRegistered: false },
      toBe: { requestRegistered: true, method: 'GET', apiKey: 'auth' },
      reason: '공통 axios 계층이 요청을 추적 가능 상태로 등록합니다.',
    },
    layer: 'HTTP',
    importance: 'support',
    breakpointTip: '공통 HTTP 클라이언트에 들어오는 payload와 API monitor 등록값을 확인합니다.',
    changeSummary: '요청이 공통 HTTP 계층과 API monitor로 전달됩니다.',
    graphColumn: 2,
    graphRow: 2,
    graphParents: ['auth-preview-4'],
    codeLocation: 'src/api/axiosClient.ts:14',
  },
  {
    id: 'auth-preview-6',
    label: 'mockServer.request(auth)',
    meaning: 'mock 설정과 API Lab override를 적용해 응답을 예약합니다.',
    data: {
      asIs: { mockScenarioResolved: false },
      toBe: { mockScenarioResolved: true },
      reason: '학습자는 mock 조건에 따라 성공/실패 세션을 비교할 수 있습니다.',
    },
    layer: 'Mock',
    importance: 'core',
    breakpointTip: 'mock status/message override가 실제 어떤 응답으로 해석되는지 확인합니다.',
    changeSummary: 'mock 응답 시나리오가 결정되고 응답이 예약됩니다.',
    graphColumn: 3,
    graphRow: 1,
    graphParents: ['auth-preview-5'],
    codeLocation: 'src/runtime/mockServer.ts:36',
  },
  {
    id: 'auth-preview-7',
    label: 'mockServer resolved auth',
    meaning: '성공 응답을 resolve하고 response data를 다음 단계로 넘깁니다.',
    data: {
      asIs: { responseData: null },
      toBe: { responseData: 'restored session payload' },
      reason: '세션 복원 성공 응답이 reducer payload 변환 단계로 넘어갑니다.',
    },
    layer: 'Mock',
    importance: 'support',
    breakpointTip: '응답 data shape가 기대한 userInfo 형태인지 확인합니다.',
    changeSummary: '성공 응답 payload가 애플리케이션으로 돌아옵니다.',
    graphColumn: 4,
    graphRow: 1,
    graphParents: ['auth-preview-6'],
    codeLocation: 'src/runtime/mockServer.ts:52',
  },
  {
    id: 'auth-preview-8',
    label: 'AUTH_RESTORE payload 생성',
    meaning: '세션 확인 성공 응답을 인증 Context가 복원할 수 있는 reducer payload로 바꿉니다.',
    data: {
      asIs: { reducerPayload: null },
      toBe: { reducerPayload: { type: 'AUTH_RESTORE', payload: 'userInfo + message' } },
      reason: 'API 응답을 reducer가 이해할 action shape로 정리합니다.',
    },
    layer: 'Mapper',
    importance: 'core',
    breakpointTip: 'API response를 reducer action payload로 변환하는 shape를 확인합니다.',
    changeSummary: 'raw API 응답이 AUTH_RESTORE action 형태로 정리됩니다.',
    graphColumn: 5,
    graphRow: 0,
    graphParents: ['auth-preview-7'],
    codeLocation: 'src/reducers/authReducer.ts:19',
  },
  {
    id: 'auth-preview-9',
    label: 'dispatch AUTH_RESTORE',
    meaning: '복원된 사용자 정보를 AuthContext reducer로 전달합니다.',
    data: {
      asIs: { dispatched: false },
      toBe: { dispatched: true, actionType: 'AUTH_RESTORE' },
      reason: '복원 payload를 실제 상태 변경 단계로 전달합니다.',
    },
    layer: 'Dispatch',
    importance: 'core',
    breakpointTip: 'dispatch payload가 reducer가 기대하는 값과 정확히 같은지 확인합니다.',
    changeSummary: 'AUTH_RESTORE action이 AuthContext reducer로 전달됩니다.',
    graphColumn: 6,
    graphRow: 0,
    graphParents: ['auth-preview-8'],
    codeLocation: 'src/pages/ChapterMountAuthPage.tsx:145',
  },
  {
    id: 'auth-preview-10',
    label: 'authReducer restores session',
    meaning: 'reducer 결과로 로그인 상태가 Context에 반영됩니다.',
    data: {
      asIs: { isLogin: false, authChecked: false },
      toBe: { isLogin: true, authChecked: true },
      reason: '세션 복원 성공 시 인증 상태가 로그인 상태로 바뀝니다.',
    },
    layer: 'Reducer',
    importance: 'core',
    breakpointTip: 'reducer에서 authChecked, isLogin, userInfo가 한 번에 어떻게 바뀌는지 봅니다.',
    changeSummary: '인증 상태가 guest에서 restored session 상태로 바뀝니다.',
    graphColumn: 7,
    graphRow: 1,
    graphParents: ['auth-preview-9'],
    codeLocation: 'src/reducers/authReducer.ts:20',
  },
  {
    id: 'auth-preview-11',
    label: 'Header rerender complete',
    meaning: 'Context 상태 변경 후 Header와 화면이 최신 인증 상태로 다시 그려집니다.',
    data: {
      asIs: { headerSessionLabel: 'guest' },
      toBe: { headerSessionLabel: 'restored user id' },
      reason: '최종적으로 사용자에게 보이는 인증 상태가 바뀝니다.',
    },
    layer: 'Render',
    importance: 'core',
    breakpointTip: '최종 UI에서 Header와 세션 표시가 실제로 바뀌는지 확인합니다.',
    changeSummary: '상태 변경 결과가 화면에 반영됩니다.',
    graphColumn: 8,
    graphRow: 1,
    graphParents: ['auth-preview-10'],
    codeLocation: 'src/pages/ChapterMountAuthPage.tsx:195',
  },
];

export function ChapterMountAuthPage() {
  const [pending, setPending] = useState(false);
  const [runModalOpen, setRunModalOpen] = useState(false);
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
    setActiveChapter('rc001 · App Mount & Auth Check');
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
      codeLocation: 'src/pages/ChapterMountAuthPage.tsx:101',
      layer: 'Page',
      importance: 'core',
      breakpointTip: 'runAuthCheck 진입 직후. 현재 authState와 beginTraceSession input을 먼저 확인합니다.',
      changeSummary: '실험 세션이 시작되고 이후 단계들이 기록됩니다.',
      graphColumn: 0,
      graphRow: 1,
    });
    await sleep();

    addLog('Effect', 'manual auth initialization started');
    addFlowStep('auth initialization effect simulated', {
      meaning: '앱 mount 시 실행되는 인증 초기화 effect를 수동으로 재현합니다.',
      codeLocation: 'src/pages/ChapterMountAuthPage.tsx:118',
      layer: 'Effect',
      importance: 'support',
      breakpointTip: '초기화 effect 맥락을 따라갈 때만 봅니다. 핵심 원인 분석은 다음 API 단계가 더 중요합니다.',
      changeSummary: '앱 초기화 시점의 인증 확인 흐름으로 진입합니다.',
      graphColumn: 1,
      graphRow: 0,
      graphParents: ['auth-preview-1'],
    });
    await sleep();

    // 앱 시작 시 인증 복원은 실제 서비스에서도 자주 등장하는 초기화 프로세스다.
    // 이 단계는 "기존 세션을 믿어도 되는가?"를 API로 확인하는 역할을 한다.
    observe('auth_check_request', { apiKey: 'auth', fallbackUser: { id: 'admin', name: 'Legacy Admin' } }, {
      label: 'Auth Check 요청 준비',
      meaning: '앱 시작 시 기존 세션이 있는지 확인하기 위한 mock API 요청을 구성합니다.',
      codeLocation: 'src/api/authApi.ts:8',
      layer: 'Page',
      importance: 'core',
      breakpointTip: 'API 호출 직전 request intent와 fallback user를 확인합니다.',
      changeSummary: '세션 검증용 auth 요청 정보가 준비됩니다.',
      graphColumn: 1,
      graphRow: 2,
      graphParents: ['auth-preview-2'],
    });
    await sleep();

    try {
      const response = await authApi.checkAuth();
      await sleep();

      observe('auth_restore_payload', { rawResponse: response, reducerPayload: { userInfo: response.data, message: response.message } }, {
        label: 'AUTH_RESTORE payload 생성',
        meaning: '세션 확인 성공 응답을 인증 Context가 복원할 수 있는 reducer payload로 바꿉니다.',
        codeLocation: 'src/reducers/authReducer.ts:19',
        layer: 'Mapper',
        importance: 'core',
        breakpointTip: 'API response를 reducer action payload로 변환하는 shape를 확인합니다.',
        changeSummary: 'raw API 응답이 AUTH_RESTORE action 형태로 정리됩니다.',
        graphColumn: 5,
        graphRow: 0,
        graphParents: ['auth-preview-7'],
      });
      await sleep();

      addLog('Dispatch', 'dispatch(AUTH_RESTORE)');
      addFlowStep('dispatch AUTH_RESTORE', {
        meaning: '복원된 사용자 정보를 AuthContext reducer로 전달합니다.',
        data: {
          asIs: {
            isLogin: beforeState.isLogin,
            userInfo: beforeState.userInfo,
            authChecked: beforeState.authChecked,
          },
          toBe: {
            type: AUTH_RESTORE,
            payload: { userInfo: response.data, message: response.message },
          },
          reason: '세션 확인 성공 응답을 reducer action으로 전달합니다.',
        },
        codeLocation: 'src/pages/ChapterMountAuthPage.tsx:145',
        layer: 'Dispatch',
        importance: 'core',
        breakpointTip: 'dispatch payload가 reducer가 기대하는 값과 정확히 같은지 확인합니다.',
        changeSummary: 'AUTH_RESTORE action이 AuthContext reducer로 전달됩니다.',
        graphColumn: 6,
        graphRow: 0,
        graphParents: ['auth-preview-8'],
      });
      await sleep();

      authDispatch({ type: AUTH_RESTORE, payload: { userInfo: response.data, message: response.message } });
      addFlowStep('authReducer restores session', {
        meaning: 'reducer 결과로 로그인 상태가 Context에 반영됩니다.',
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
          reason: 'AUTH_RESTORE 처리 후 인증 상태를 복원합니다.',
        },
        codeLocation: 'src/reducers/authReducer.ts:20',
        layer: 'Reducer',
        importance: 'core',
        breakpointTip: 'reducer에서 authChecked, isLogin, userInfo가 한 번에 어떻게 바뀌는지 봅니다.',
        changeSummary: '인증 상태가 guest에서 restored session 상태로 바뀝니다.',
        graphColumn: 7,
        graphRow: 1,
        graphParents: ['auth-preview-9'],
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
        data: {
          asIs: {
            isLogin: beforeState.isLogin,
            userInfo: beforeState.userInfo,
            authChecked: beforeState.authChecked,
          },
          toBe: {
            type: LOGOUT,
            payload: { error: errorMessage },
          },
          reason: '세션 복원에 실패했으므로 안전하게 guest 상태로 정리합니다.',
        },
        codeLocation: 'src/pages/ChapterMountAuthPage.tsx:172',
        layer: 'Dispatch',
        importance: 'core',
        breakpointTip: '실패 시 LOGOUT fallback payload가 어떤 에러 메시지를 담는지 확인합니다.',
        changeSummary: '세션 복원 실패를 guest 상태 전환 action으로 넘깁니다.',
        graphColumn: 6,
        graphRow: 2,
        graphParents: ['auth-preview-6'],
      });
      await sleep();

      authDispatch({ type: LOGOUT, payload: { error: errorMessage } });
      addFlowStep('authReducer marks authChecked fallback', {
        meaning: '인증 확인은 끝났지만 로그인 세션은 없는 상태로 정리합니다.',
        data: {
          asIs: {
            isLogin: beforeState.isLogin,
            userInfo: beforeState.userInfo,
            authChecked: beforeState.authChecked,
          },
          toBe: {
            isLogin: false,
            userInfo: null,
            authChecked: true,
            error: errorMessage,
          },
          reason: '세션은 없지만 auth check는 끝났다는 상태를 남깁니다.',
        },
        codeLocation: 'src/reducers/authReducer.ts:42',
        layer: 'Reducer',
        importance: 'core',
        breakpointTip: '실패 시에도 authChecked가 true가 되는지 꼭 확인합니다.',
        changeSummary: '로그인 세션은 없지만 auth check 완료 상태로 정리됩니다.',
        graphColumn: 7,
        graphRow: 2,
        graphParents: ['dispatch LOGOUT fallback'],
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
        codeLocation: 'src/pages/ChapterMountAuthPage.tsx:195',
        layer: 'Render',
        importance: 'core',
        breakpointTip: '최종 UI에서 Header와 세션 표시가 실제로 바뀌는지 확인합니다.',
        changeSummary: '상태 변경 결과가 화면에 반영됩니다.',
        graphColumn: 8,
        graphRow: 1,
        graphParents: ['authReducer restores session', 'authReducer marks authChecked fallback'],
      });
      await sleep();
      completeTraceSession(sessionResult);
      setPending(false);
    }
  };

  const launchRunModal = () => {
    if (pending) {
      return;
    }

    setRunModalOpen(true);
    globalThis.setTimeout(() => {
      void runAuthCheck();
    }, 0);
  };

  return (
    <>
      <TraceMonitorLayout
        title="rc001 · App Mount & Auth Check"
        subtitle="Run the startup auth restoration lifecycle as a focused common session pattern."
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
            <button type="button" onClick={launchRunModal} disabled={pending}>
              {pending ? 'Checking...' : 'Run auth check'}
            </button>
            {authState.error && <p className="error-text">{authState.error}</p>}
          </div>
        }
        notes={
          <>
            <p>
              Index: <code>rc001</code>
            </p>
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
        stepActions={{
          'auth-preview-1': {
            label: pending ? 'Checking...' : 'Run from step 1',
            onClick: launchRunModal,
            disabled: pending,
          },
        }}
      />
      <ExecutionRunModal open={runModalOpen} onClose={() => setRunModalOpen(false)} title="rc001 Live Run" />
    </>
  );
}
