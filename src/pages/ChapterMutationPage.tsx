import { FormEvent, useEffect, useState } from 'react';
import { postApi } from '../api/postApi';
import { TraceMonitorLayout } from '../components/TraceMonitorLayout';
import { useCommon } from '../context/CommonContext';
import { usePostDispatch, usePostState } from '../context/PostContext';
import {
  ADD_POST_REQUEST,
  ADD_POST_SUCCESS,
  FETCH_POSTS_SUCCESS,
  POST_MUTATION_FAILURE,
  REMOVE_POST_REQUEST,
  REMOVE_POST_SUCCESS,
} from '../reducers/postActionTypes';
import { addFlowStep } from '../runtime/flowTracker';
import { addLog } from '../runtime/logger';
import type { MockServerFailure } from '../runtime/mockServer';
import { useRuntime } from '../runtime/RuntimeContext';

export function ChapterMutationPage() {
  const [title, setTitle] = useState('Reducer action note');
  const [body, setBody] = useState('Mutation requests update Context through dispatch.');
  const [pending, setPending] = useState(false);
  const postState = usePostState();
  const postDispatch = usePostDispatch();
  const { setActiveChapter } = useCommon();
  const { beginTraceSession, captureStateDiff, refreshRuntimeSnapshot, setCallStack } = useRuntime();

  useEffect(() => {
    setActiveChapter('Chapter 4 - Create/Delete Mutation');
  }, [setActiveChapter]);

  const loadSamples = () => {
    const beforeState = postState;
    beginTraceSession('Load Sample Posts', 'loadSamples()', [
      'ChapterMutationPage.loadSamples',
      'postApi.fetchPosts',
      'axiosClient.get',
      'mockServer.request',
      'dispatch(FETCH_POSTS_SUCCESS)',
      'postReducer',
    ]);
    setPending(true);

    postApi
      .fetchPosts()
      .then((response) => {
        addLog('Dispatch', 'dispatch(FETCH_POSTS_SUCCESS)');
        addFlowStep('dispatch FETCH_POSTS_SUCCESS');
        postDispatch({ type: FETCH_POSTS_SUCCESS, payload: { posts: response.data, message: response.message } });
        addFlowStep('postReducer loads sample posts');
        captureStateDiff(beforeState, { posts: response.data, loading: false, error: null, message: response.message });
      })
      .finally(() => {
        setPending(false);
        addLog('Render', 'Mutation list rerendered after sample load');
        addFlowStep('rerender complete');
        refreshRuntimeSnapshot();
      });
  };

  const handleInput = (field: 'title' | 'body', value: string) => {
    if (field === 'title') {
      setTitle(value);
    } else {
      setBody(value);
    }
    setCallStack(['onChange()', 'setLocalFormState()']);
  };

  const handleCreate = (event: FormEvent) => {
    event.preventDefault();
    const beforeState = postState;
    setPending(true);

    beginTraceSession('Create Post', 'handleCreateSubmit()', [
      'ChapterMutationPage.handleCreateSubmit',
      'dispatch(ADD_POST_REQUEST)',
      'postApi.createPost',
      'axiosClient.post',
      'mockServer.request',
      'dispatch(ADD_POST_SUCCESS | POST_MUTATION_FAILURE)',
      'postReducer',
    ]);

    addLog('Dispatch', 'dispatch(ADD_POST_REQUEST)');
    addFlowStep('dispatch ADD_POST_REQUEST');
    postDispatch({ type: ADD_POST_REQUEST });

    postApi
      .createPost({ title, body })
      .then((response) => {
        addLog('Dispatch', 'dispatch(ADD_POST_SUCCESS)');
        addFlowStep('dispatch ADD_POST_SUCCESS');
        postDispatch({ type: ADD_POST_SUCCESS, payload: { post: response.data, message: response.message } });
        addFlowStep('postReducer prepends created post');
        captureStateDiff(beforeState, {
          posts: [response.data, ...beforeState.posts],
          loading: false,
          error: null,
          message: response.message,
        });
      })
      .catch((error: MockServerFailure) => {
        const errorMessage = error.response?.message ?? 'create failed';
        addLog('Dispatch', 'dispatch(POST_MUTATION_FAILURE)');
        addFlowStep('dispatch POST_MUTATION_FAILURE');
        postDispatch({ type: POST_MUTATION_FAILURE, payload: { error: errorMessage } });
        addFlowStep('postReducer renders mutation error');
        captureStateDiff(beforeState, { ...beforeState, loading: false, error: errorMessage, message: null });
      })
      .finally(() => {
        setPending(false);
        addLog('Render', 'Post list rerendered after create');
        addFlowStep('rerender complete');
        refreshRuntimeSnapshot();
      });
  };

  const handleDelete = (id: number) => {
    const beforeState = postState;
    setPending(true);

    beginTraceSession('Delete Post', `handleDeleteClick(${id})`, [
      'ChapterMutationPage.handleDeleteClick',
      'dispatch(REMOVE_POST_REQUEST)',
      'postApi.deletePost',
      'axiosClient.delete',
      'mockServer.request',
      'dispatch(REMOVE_POST_SUCCESS | POST_MUTATION_FAILURE)',
      'postReducer',
    ]);

    addLog('Dispatch', 'dispatch(REMOVE_POST_REQUEST)');
    addFlowStep('dispatch REMOVE_POST_REQUEST');
    postDispatch({ type: REMOVE_POST_REQUEST });

    postApi
      .deletePost(id)
      .then((response) => {
        addLog('Dispatch', 'dispatch(REMOVE_POST_SUCCESS)');
        addFlowStep('dispatch REMOVE_POST_SUCCESS');
        postDispatch({ type: REMOVE_POST_SUCCESS, payload: { id: response.data.deletedId, message: response.message } });
        addFlowStep('postReducer removes deleted post');
        captureStateDiff(beforeState, {
          posts: beforeState.posts.filter((post) => post.id !== response.data.deletedId),
          loading: false,
          error: null,
          message: response.message,
        });
      })
      .catch((error: MockServerFailure) => {
        const errorMessage = error.response?.message ?? 'delete failed';
        addLog('Dispatch', 'dispatch(POST_MUTATION_FAILURE)');
        addFlowStep('dispatch POST_MUTATION_FAILURE');
        postDispatch({ type: POST_MUTATION_FAILURE, payload: { error: errorMessage } });
        addFlowStep('postReducer renders mutation error');
        captureStateDiff(beforeState, { ...beforeState, loading: false, error: errorMessage, message: null });
      })
      .finally(() => {
        setPending(false);
        addLog('Render', 'Post list rerendered after delete');
        addFlowStep('rerender complete');
        refreshRuntimeSnapshot();
      });
  };

  return (
    <TraceMonitorLayout
      title="Chapter 4 - Create/Delete Mutation"
      subtitle="Run create/delete mutations and inspect payloads, reducer actions, and PostContext diffs."
      rawState={postState}
      rawStateLabel="PostContext"
      actionPanel={
        <div className="mini-stack">
          <button type="button" onClick={loadSamples} disabled={pending}>
            Load sample posts
          </button>
          <form className="mini-stack" onSubmit={handleCreate}>
            <label>
              Title
              <input value={title} onChange={(event) => handleInput('title', event.target.value)} />
            </label>
            <label>
              Body
              <textarea value={body} onChange={(event) => handleInput('body', event.target.value)} />
            </label>
            <button type="submit" disabled={pending}>
              Create post
            </button>
          </form>
          {postState.error && <p className="error-text">{postState.error}</p>}
          <ul className="post-list compact">
            {postState.posts.map((post) => (
              <li key={post.id}>
                <strong>{post.title}</strong>
                <button type="button" onClick={() => handleDelete(post.id)} disabled={pending}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      }
      notes={
        <>
          <p>
            Component: <code>src/pages/ChapterMutationPage.tsx</code>
          </p>
          <p>
            API: <code>src/api/postApi.ts</code>
          </p>
          <p>
            Reducer: <code>src/reducers/postReducer.ts</code>
          </p>
          <p>
            Create path: <code>handleCreateSubmit -&gt; postApi.createPost -&gt; axiosClient.post -&gt; mockServer.request -&gt; ADD_POST_SUCCESS</code>
          </p>
          <p>
            Delete path: <code>handleDeleteClick -&gt; postApi.deletePost -&gt; axiosClient.delete -&gt; mockServer.request -&gt; REMOVE_POST_SUCCESS</code>
          </p>
          <p>
            Mock: <code>?mock=write:500:create-failed,delete:500:delete-failed</code>
          </p>
        </>
      }
    />
  );
}
