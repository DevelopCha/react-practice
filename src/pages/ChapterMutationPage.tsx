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
  const { beginTraceSession, captureStateDiff, observe, refreshRuntimeSnapshot, setCallStack } = useRuntime();

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
    ], { currentPostCount: postState.posts.length });
    setPending(true);

    postApi
      .fetchPosts()
      .then((response) => {
        addLog('Dispatch', 'dispatch(FETCH_POSTS_SUCCESS)');
        addFlowStep('dispatch FETCH_POSTS_SUCCESS');
        postDispatch({ type: FETCH_POSTS_SUCCESS, payload: { posts: response.data, message: response.message } });
        addFlowStep('postReducer loads sample posts');
        captureStateDiff(beforeState, { posts: response.data, loading: false, error: null, message: response.message }, 'FETCH_POSTS_SUCCESS dispatch completed. response.data가 posts 상태를 대체합니다.');
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
    ], { title, body });
    observe('create_input_collect', { title, body }, {
      label: '게시글 입력값 수집',
      meaning: 'Input Lab의 title/body 값을 이번 Create Post Session의 실험 입력으로 고정합니다.',
      codeLocation: 'src/pages/ChapterMutationPage.tsx:83',
    });
    observe('create_payload_build', { requestPayload: { title, body } }, {
      label: 'create payload 생성',
      meaning: '폼 상태를 postApi.createPost가 받을 mutation payload로 변환합니다.',
      codeLocation: 'src/api/postApi.ts:13',
    });

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
        }, 'ADD_POST_SUCCESS dispatch completed. 생성된 post가 목록 맨 앞에 추가됩니다.');
      })
      .catch((error: MockServerFailure) => {
        const errorMessage = error.response?.message ?? 'create failed';
        addLog('Dispatch', 'dispatch(POST_MUTATION_FAILURE)');
        addFlowStep('dispatch POST_MUTATION_FAILURE');
        postDispatch({ type: POST_MUTATION_FAILURE, payload: { error: errorMessage } });
        addFlowStep('postReducer renders mutation error');
        captureStateDiff(beforeState, { ...beforeState, loading: false, error: errorMessage, message: null }, 'POST_MUTATION_FAILURE dispatch completed. 목록은 유지되고 error만 표시됩니다.');
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
    ], { deleteId: id });
    observe('delete_payload_build', { requestPayload: { deletedId: id } }, {
      label: 'delete payload 생성',
      meaning: '사용자가 선택한 post id를 삭제 API와 reducer가 공유할 payload로 고정합니다.',
      codeLocation: 'src/api/postApi.ts:18',
    });

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
        }, 'REMOVE_POST_SUCCESS dispatch completed. deletedId와 일치하는 post가 목록에서 제거됩니다.');
      })
      .catch((error: MockServerFailure) => {
        const errorMessage = error.response?.message ?? 'delete failed';
        addLog('Dispatch', 'dispatch(POST_MUTATION_FAILURE)');
        addFlowStep('dispatch POST_MUTATION_FAILURE');
        postDispatch({ type: POST_MUTATION_FAILURE, payload: { error: errorMessage } });
        addFlowStep('postReducer renders mutation error');
        captureStateDiff(beforeState, { ...beforeState, loading: false, error: errorMessage, message: null }, 'POST_MUTATION_FAILURE dispatch completed. 목록은 유지되고 error만 표시됩니다.');
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
      apiLabKeys={['users', 'write', 'delete']}
      processGuide={
        <>
          <p>생성/삭제 mutation은 기존 목록을 바꾸는 흐름이다. 요청 전 loading, 성공 후 목록 갱신, 실패 후 복구 메시지가 핵심이다.</p>
          <ol>
            <li><strong>request action</strong>: 중복 실행을 막고 사용자에게 처리 중임을 알려준다.</li>
            <li><strong>mutation API</strong>: 입력값이나 id를 서버가 이해할 payload로 보낸다.</li>
            <li><strong>success/failure reducer</strong>: 성공 시 목록을 변경하고 실패 시 기존 목록을 보존하며 error를 보여준다.</li>
          </ol>
        </>
      }
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
