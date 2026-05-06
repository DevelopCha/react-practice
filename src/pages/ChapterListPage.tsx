import { useEffect } from 'react';
import { LearningLayout } from '../components/LearningLayout';
import { useCommon } from '../context/CommonContext';
import { usePosts } from '../context/PostContext';
import { useRuntime } from '../runtime/RuntimeContext';
import type { FlowStep } from '../types/runtime';

const steps: FlowStep[] = [
  { id: 'mount', label: 'PostListPage mounted' },
  { id: 'effect', label: 'useEffect fetch executed' },
  { id: 'dispatch-request', label: 'dispatch(FETCH_POSTS_REQUEST)' },
  { id: 'api', label: 'postApi.fetchPosts() called' },
  { id: 'axios', label: 'axiosClient.get() requested' },
  { id: 'mock', label: 'mockServer returns list response' },
  { id: 'dispatch-success', label: 'dispatch(FETCH_POSTS_SUCCESS)' },
  { id: 'render', label: 'loading/success/error UI rendered' },
];

export function ChapterListPage() {
  const { state, fetchPosts } = usePosts();
  const { setActiveChapter } = useCommon();
  const { resetRuntime, runEvents } = useRuntime();

  useEffect(() => {
    setActiveChapter('Chapter 3 - Data Fetch List');
    resetRuntime(steps);
    runEvents([{ stepId: 'mount', kind: 'Mount', message: 'PostListPage mounted' }]);
  }, [resetRuntime, runEvents, setActiveChapter]);

  const runFetch = async () => {
    await runEvents([
      { stepId: 'effect', kind: 'Effect', message: 'useEffect fetchPosts executed', callStack: ['useEffect()', 'fetchPosts()'] },
      { stepId: 'dispatch-request', kind: 'Dispatch', message: 'FETCH_POSTS_REQUEST dispatched' },
      { stepId: 'api', kind: 'API', message: 'postApi.fetchPosts() called', callStack: ['fetchPosts()', 'postApi.fetchPosts()'] },
      {
        stepId: 'axios',
        kind: 'API',
        message: 'axiosClient.get("/posts") requested',
        callStack: ['fetchPosts()', 'postApi.fetchPosts()', 'axiosClient.get()'],
      },
    ]);
    await fetchPosts();
    await runEvents([
      {
        stepId: 'mock',
        kind: 'Mock',
        message: 'users mock resolved or rejected from query string config',
        callStack: ['fetchPosts()', 'postApi.fetchPosts()', 'axiosClient.get()', 'mockServer.request()'],
      },
      { stepId: 'dispatch-success', kind: 'Dispatch', message: 'FETCH_POSTS_SUCCESS or FETCH_POSTS_FAILURE dispatched' },
      { stepId: 'render', kind: 'Render', message: 'List UI rerendered with loading, success, error, or empty state', callStack: [] },
    ]);
  };

  return (
    <LearningLayout title="Chapter 3 - Data Fetch List" subtitle="Trigger a page-style fetch and inspect every state branch.">
      <div className="mini-stack">
        <button type="button" onClick={runFetch} disabled={state.loading}>
          {state.loading ? 'Fetching...' : 'Fetch posts'}
        </button>
        {state.loading && <p className="muted">Loading state is true.</p>}
        {state.error && <p className="error-text">{state.error}</p>}
        {!state.loading && !state.error && state.posts.length === 0 && <p className="muted">Empty state: no posts loaded.</p>}
        <ul className="post-list">
          {state.posts.map((post) => (
            <li key={post.id}>
              <strong>{post.title}</strong>
              <span>{post.body}</span>
            </li>
          ))}
        </ul>
      </div>
    </LearningLayout>
  );
}
