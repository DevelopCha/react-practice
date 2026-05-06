import { useEffect, useState } from 'react';
import { postApi } from '../api/postApi';
import { TraceMonitorLayout } from '../components/TraceMonitorLayout';
import { useCommon } from '../context/CommonContext';
import { usePostDispatch, usePostState } from '../context/PostContext';
import { FETCH_POSTS_FAILURE, FETCH_POSTS_REQUEST, FETCH_POSTS_SUCCESS } from '../reducers/postActionTypes';
import { addFlowStep } from '../runtime/flowTracker';
import { addLog } from '../runtime/logger';
import type { MockServerFailure } from '../runtime/mockServer';
import { useRuntime } from '../runtime/RuntimeContext';

export function ChapterListPage() {
  const [pending, setPending] = useState(false);
  const postState = usePostState();
  const postDispatch = usePostDispatch();
  const { setActiveChapter } = useCommon();
  const { beginTraceSession, captureStateDiff, observe, refreshRuntimeSnapshot } = useRuntime();

  useEffect(() => {
    setActiveChapter('Chapter 3 - Data Fetch List');
  }, [setActiveChapter]);

  const runFetch = () => {
    const beforeState = postState;
    setPending(true);
    beginTraceSession('Fetch Posts', 'handleFetchPosts()', [
      'ChapterListPage.handleFetchPosts',
      'dispatch(FETCH_POSTS_REQUEST)',
      'postApi.fetchPosts',
      'axiosClient.get',
      'mockServer.request',
      'dispatch(FETCH_POSTS_SUCCESS | FETCH_POSTS_FAILURE)',
      'postReducer',
    ], { currentPostCount: postState.posts.length });
    observe('fetch_request_build', { apiKey: 'users' }, {
      label: '목록 조회 request 구성',
      meaning: 'GET 요청은 body가 없지만 API Lab의 request JSON을 통해 실험용 조건을 함께 관찰할 수 있습니다.',
      codeLocation: 'src/api/postApi.ts:8',
    });

    addLog('Dispatch', 'dispatch(FETCH_POSTS_REQUEST)');
    addFlowStep('dispatch FETCH_POSTS_REQUEST');
    postDispatch({ type: FETCH_POSTS_REQUEST });

    postApi
      .fetchPosts()
      .then((response) => {
        addLog('Dispatch', 'dispatch(FETCH_POSTS_SUCCESS)');
        addFlowStep('dispatch FETCH_POSTS_SUCCESS');
        postDispatch({ type: FETCH_POSTS_SUCCESS, payload: { posts: response.data, message: response.message } });
        addFlowStep('postReducer stores fetched posts');
        observe('fetch_response_transform', { rawResponse: response, reducerPayload: { posts: response.data, message: response.message } }, {
          label: '목록 응답을 reducer payload로 변환',
          meaning: 'mock response의 data 배열이 PostContext의 posts 상태로 들어갈 action payload가 됩니다.',
          codeLocation: 'src/reducers/postReducer.ts:28',
        });
        captureStateDiff(beforeState, {
          posts: response.data,
          loading: false,
          error: null,
          message: response.message,
        }, 'FETCH_POSTS_SUCCESS dispatch completed. response.data가 posts 상태를 대체합니다.');
      })
      .catch((error: MockServerFailure) => {
        const errorMessage = error.response?.message ?? 'fetch failed';
        addLog('Dispatch', 'dispatch(FETCH_POSTS_FAILURE)');
        addFlowStep('dispatch FETCH_POSTS_FAILURE');
        postDispatch({ type: FETCH_POSTS_FAILURE, payload: { error: errorMessage } });
        addFlowStep('postReducer renders error state');
        captureStateDiff(beforeState, {
          posts: [],
          loading: false,
          error: errorMessage,
          message: null,
        }, 'FETCH_POSTS_FAILURE dispatch completed. 목록은 비워지고 error 상태가 표시됩니다.');
      })
      .finally(() => {
        setPending(false);
        addLog('Render', 'Post list rerendered after fetch');
        addFlowStep('list rerender complete');
        refreshRuntimeSnapshot();
      });
  };

  return (
    <TraceMonitorLayout
      title="Chapter 3 - Data Fetch List"
      subtitle="Fetch a list and inspect request, mock response, reducer action, and post state diff."
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
