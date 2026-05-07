import { useEffect, useState } from 'react';
import { postApi } from '../api/postApi';
import { TraceMonitorLayout } from '../components/TraceMonitorLayout';
import { useCommon } from '../context/CommonContext';
import { usePostDispatch, usePostState } from '../context/PostContext';
import { FETCH_POSTS_FAILURE, FETCH_POSTS_REQUEST, FETCH_POSTS_SUCCESS } from '../reducers/postActionTypes';
import { addFlowStep } from '../runtime/flowTracker';
import { addLog } from '../runtime/logger';
import type { MockServerFailure } from '../runtime/mockServer';
import { sleep } from '../runtime/sleep';
import { useRuntime } from '../runtime/RuntimeContext';
import type { FlowStep } from '../types/runtime';

const fetchListPreviewSteps: FlowStep[] = [
  {
    id: 'fetch-preview-1',
    label: 'handleFetchPosts()',
    meaning: '사용자가 목록 조회 실험을 시작하는 클릭 핸들러입니다.',
    data: {
      asIs: { postCount: 0, loading: false },
      toBe: { action: 'start fetch session' },
      reason: 'rc002 학습 세션을 시작하는 버튼 클릭 단계입니다.',
    },
    codeLocation: 'src/pages/ChapterListPage.tsx:53',
  },
  {
    id: 'fetch-preview-2',
    label: '목록 조회 request 구성',
    meaning: '조회 요청에 사용할 apiKey와 실험 조건을 고정합니다.',
    data: {
      asIs: { request: null },
      toBe: { request: { apiKey: 'users', purpose: 'fetch posts' } },
      reason: '조회 대상과 실험 조건을 먼저 고정합니다.',
    },
    codeLocation: 'src/pages/ChapterListPage.tsx:65',
  },
  {
    id: 'fetch-preview-3',
    label: 'dispatch FETCH_POSTS_REQUEST',
    meaning: 'loading 상태를 먼저 켜서 사용자가 진행 중임을 알 수 있게 합니다.',
    data: {
      asIs: { loading: false },
      toBe: { loading: true, actionType: 'FETCH_POSTS_REQUEST' },
      reason: '조회 시작을 화면에 먼저 반영합니다.',
    },
    codeLocation: 'src/pages/ChapterListPage.tsx:73',
  },
  {
    id: 'fetch-preview-4',
    label: 'postApi.fetchPosts()',
    meaning: '목록 조회 API 호출이 axios와 mock server 흐름으로 이어집니다.',
    data: {
      asIs: { apiCalled: false },
      toBe: { apiCalled: true },
      reason: '실제 목록 조회 API 흐름이 시작됩니다.',
    },
    codeLocation: 'src/api/postApi.ts:8',
  },
  {
    id: 'fetch-preview-5',
    label: '목록 응답을 reducer payload로 변환',
    meaning: '응답 배열을 PostContext가 사용할 posts/message payload로 정리합니다.',
    data: {
      asIs: { reducerPayload: null },
      toBe: { reducerPayload: { posts: 'response.data[]', message: 'response.message' } },
      reason: '응답 데이터를 reducer가 사용할 형태로 정리합니다.',
    },
    codeLocation: 'src/reducers/postReducer.ts:28',
  },
  {
    id: 'fetch-preview-6',
    label: 'dispatch FETCH_POSTS_SUCCESS',
    meaning: '성공 응답을 reducer로 전달해 화면 상태를 교체합니다.',
    data: {
      asIs: { dispatched: false },
      toBe: { dispatched: true, actionType: 'FETCH_POSTS_SUCCESS' },
      reason: '조회 성공 데이터를 실제 상태 변경 단계로 보냅니다.',
    },
    codeLocation: 'src/pages/ChapterListPage.tsx:90',
  },
  {
    id: 'fetch-preview-7',
    label: 'postReducer stores fetched posts',
    meaning: '목록 상태가 응답 데이터 기준으로 새로 반영됩니다.',
    data: {
      asIs: { postCount: 0, error: null },
      toBe: { postCount: 'response.data.length', error: null },
      reason: '목록 상태가 응답 기준으로 교체됩니다.',
    },
    codeLocation: 'src/reducers/postReducer.ts:28',
  },
  {
    id: 'fetch-preview-8',
    label: 'list rerender complete',
    meaning: '최신 목록 상태가 화면에 다시 렌더됩니다.',
    data: {
      asIs: { visibleList: 'before fetch' },
      toBe: { visibleList: 'latest fetched posts' },
      reason: '사용자에게 최종 목록 결과가 보이게 됩니다.',
    },
    codeLocation: 'src/pages/ChapterListPage.tsx:133',
  },
];

export function ChapterListPage() {
  const [pending, setPending] = useState(false);
  const postState = usePostState();
  const postDispatch = usePostDispatch();
  const { setActiveChapter } = useCommon();
  const { beginTraceSession, captureStateDiff, completeTraceSession, observe, refreshRuntimeSnapshot, setPreviewFlowSteps } = useRuntime();

  useEffect(() => {
    setActiveChapter('rc002 · Data Fetch List');
    setPreviewFlowSteps(fetchListPreviewSteps);
  }, [setActiveChapter, setPreviewFlowSteps]);

  const runFetch = async () => {
    const beforeState = postState;
    setPending(true);
    let sessionResult = 'Fetch Posts 실험 완료';
    setPreviewFlowSteps(fetchListPreviewSteps);
    beginTraceSession('Fetch Posts', 'handleFetchPosts()', [
      'ChapterListPage.handleFetchPosts',
      'dispatch(FETCH_POSTS_REQUEST)',
      'postApi.fetchPosts',
      'axiosClient.get',
      'mockServer.request',
      'dispatch(FETCH_POSTS_SUCCESS | FETCH_POSTS_FAILURE)',
      'postReducer',
    ], { currentPostCount: postState.posts.length }, {
      meaning: '사용자가 목록 조회 실험을 시작하는 클릭 핸들러입니다.',
      codeLocation: 'src/pages/ChapterListPage.tsx:53',
    });
    await sleep();

    observe('fetch_request_build', { apiKey: 'users' }, {
      label: '목록 조회 request 구성',
      meaning: 'GET 요청은 body가 없지만 API Lab의 request JSON을 통해 실험용 조건을 함께 관찰할 수 있습니다.',
      codeLocation: 'src/pages/ChapterListPage.tsx:65',
    });
    await sleep();

    addLog('Dispatch', 'dispatch(FETCH_POSTS_REQUEST)');
    addFlowStep('dispatch FETCH_POSTS_REQUEST', {
      meaning: '요청 시작과 동시에 loading 상태를 true로 만들어 대기 중임을 표시합니다.',
      data: {
        asIs: {
          loading: beforeState.loading,
          postCount: beforeState.posts.length,
        },
        toBe: {
          type: FETCH_POSTS_REQUEST,
          loading: true,
        },
        reason: '조회 시작 상태를 먼저 사용자에게 노출합니다.',
      },
      codeLocation: 'src/pages/ChapterListPage.tsx:73',
    });
    postDispatch({ type: FETCH_POSTS_REQUEST });
    await sleep();

    postApi
      .fetchPosts()
      .then((response) => {
        observe('fetch_response_transform', { rawResponse: response, reducerPayload: { posts: response.data, message: response.message } }, {
          label: '목록 응답을 reducer payload로 변환',
          meaning: 'mock response의 data 배열이 PostContext의 posts 상태로 들어갈 action payload가 됩니다.',
          codeLocation: 'src/reducers/postReducer.ts:28',
        });
        addLog('Dispatch', 'dispatch(FETCH_POSTS_SUCCESS)');
        addFlowStep('dispatch FETCH_POSTS_SUCCESS', {
          meaning: '성공 응답을 reducer로 전달해 기존 목록 상태를 새 데이터로 교체합니다.',
          data: {
            asIs: {
              postCount: beforeState.posts.length,
              loading: beforeState.loading,
            },
            toBe: {
              type: FETCH_POSTS_SUCCESS,
              payload: { postCount: response.data.length, message: response.message },
            },
            reason: '조회 성공 결과를 reducer action으로 전달합니다.',
          },
          codeLocation: 'src/pages/ChapterListPage.tsx:90',
        });
        postDispatch({ type: FETCH_POSTS_SUCCESS, payload: { posts: response.data, message: response.message } });
        addFlowStep('postReducer stores fetched posts', {
          meaning: 'response.data가 posts 상태에 저장되고 message도 함께 갱신됩니다.',
          data: {
            asIs: {
              postCount: beforeState.posts.length,
              error: beforeState.error,
            },
            toBe: {
              postCount: response.data.length,
              firstPostTitle: response.data[0]?.title ?? null,
              error: null,
              message: response.message,
            },
            reason: '조회 성공 후 목록 상태를 응답 기준으로 교체합니다.',
          },
          codeLocation: 'src/reducers/postReducer.ts:28',
        });
        captureStateDiff(beforeState, {
          posts: response.data,
          loading: false,
          error: null,
          message: response.message,
        }, 'FETCH_POSTS_SUCCESS dispatch completed. response.data가 posts 상태를 대체합니다.');
        sessionResult = `Fetch 성공: ${response.data.length}개의 목록 항목이 로드되었습니다.`;
      })
      .catch((error: MockServerFailure) => {
        const errorMessage = error.response?.message ?? 'fetch failed';
        observe('fetch_failure', { error: error.response ?? { message: errorMessage } }, {
          label: '목록 실패 응답 처리',
          meaning: '실패 응답을 error 상태로 바꾸고 목록을 비운 뒤 사용자에게 실패 원인을 노출합니다.',
          codeLocation: 'src/pages/ChapterListPage.tsx:106',
        });
        addLog('Dispatch', 'dispatch(FETCH_POSTS_FAILURE)');
        addFlowStep('dispatch FETCH_POSTS_FAILURE', {
          meaning: '실패 결과를 reducer에 전달해 error와 empty 상태를 명확히 남깁니다.',
          data: {
            asIs: {
              postCount: beforeState.posts.length,
              error: beforeState.error,
            },
            toBe: {
              type: FETCH_POSTS_FAILURE,
              payload: { error: errorMessage },
            },
            reason: '실패 응답을 조회 실패 action으로 전달합니다.',
          },
          codeLocation: 'src/pages/ChapterListPage.tsx:111',
        });
        postDispatch({ type: FETCH_POSTS_FAILURE, payload: { error: errorMessage } });
        addFlowStep('postReducer renders error state', {
          meaning: 'posts는 비워지고 error 필드에는 실패 메시지가 채워집니다.',
          data: {
            asIs: {
              postCount: beforeState.posts.length,
              error: beforeState.error,
            },
            toBe: {
              postCount: 0,
              error: errorMessage,
              message: null,
            },
            reason: '조회 실패 시 빈 목록과 에러 상태를 명확히 남깁니다.',
          },
          codeLocation: 'src/reducers/postReducer.ts:40',
        });
        captureStateDiff(beforeState, {
          posts: [],
          loading: false,
          error: errorMessage,
          message: null,
        }, 'FETCH_POSTS_FAILURE dispatch completed. 목록은 비워지고 error 상태가 표시됩니다.');
        sessionResult = `Fetch 실패: ${errorMessage}`;
      })
      .finally(() => {
        setPending(false);
        addLog('Render', 'Post list rerendered after fetch');
        addFlowStep('list rerender complete', {
          meaning: '최종 목록 상태가 UI에 반영되어 성공, 빈 목록, 실패 화면 중 하나가 보이게 됩니다.',
          codeLocation: 'src/pages/ChapterListPage.tsx:133',
        });
        refreshRuntimeSnapshot();
        completeTraceSession(sessionResult);
      });
  };

  return (
    <TraceMonitorLayout
      title="rc002 · Data Fetch List"
      subtitle="Run a common read flow session and inspect loading, response transform, reducer update, and rerender."
      rawState={postState}
      rawStateLabel="PostContext"
      apiLabKeys={['users']}
      processGuide={
        <>
          <p>목록 조회는 서버 데이터를 화면 상태로 옮기는 가장 기본적인 read flow다. loading/error/data 상태 분리가 중요하다.</p>
          <ol>
            <li><strong>FETCH_POSTS_REQUEST</strong>: 사용자가 기다릴 수 있도록 loading 상태를 먼저 켠다.</li>
            <li><strong>API response</strong>: raw response를 reducer가 사용할 posts/message payload로 정리한다.</li>
            <li><strong>success/failure reducer</strong>: 성공은 목록을 교체하고, 실패는 error 상태를 명확히 남긴다.</li>
          </ol>
        </>
      }
      actionPanel={
        <div className="mini-stack">
          <button type="button" onClick={runFetch} disabled={pending}>
            {pending ? 'Fetching...' : 'Fetch posts'}
          </button>
          {postState.error && <p className="error-text">{postState.error}</p>}
          <div className="status-box">
            <strong>Current posts</strong>
            <span>{postState.posts.length} loaded</span>
          </div>
          <ul className="post-list compact">
            {postState.posts.map((post) => (
              <li key={post.id}>
                <strong>{post.title}</strong>
              </li>
            ))}
          </ul>
        </div>
      }
      notes={
        <>
          <p>
            Index: <code>rc002</code>
          </p>
          <p>
            Component: <code>src/pages/ChapterListPage.tsx</code>
          </p>
          <p>
            API: <code>src/api/postApi.ts</code>
          </p>
          <p>
            Reducer: <code>src/reducers/postReducer.ts</code>
          </p>
          <p>
            Path: <code>handleFetchPosts -&gt; dispatch request -&gt; postApi.fetchPosts -&gt; axiosClient.get -&gt; mockServer.request -&gt; dispatch success/failure -&gt; postReducer</code>
          </p>
          <p>
            Mock: <code>?mock=users:200:list-ok</code> or <code>?mock=users:404:list-failed</code>
          </p>
        </>
      }
    />
  );
}
