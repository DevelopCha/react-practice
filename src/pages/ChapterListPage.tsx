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
  const { beginTraceSession, captureStateDiff, refreshRuntimeSnapshot } = useRuntime();

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
    ]);

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
        captureStateDiff(beforeState, {
          posts: response.data,
          loading: false,
          error: null,
          message: response.message,
        });
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
        });
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
