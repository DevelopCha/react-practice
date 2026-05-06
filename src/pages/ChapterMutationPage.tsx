import { FormEvent, useEffect, useState } from 'react';
import { LearningLayout } from '../components/LearningLayout';
import { useCommon } from '../context/CommonContext';
import { usePosts } from '../context/PostContext';
import { useRuntime } from '../runtime/RuntimeContext';
import type { FlowStep } from '../types/runtime';

const steps: FlowStep[] = [
  { id: 'input', label: 'form input changed' },
  { id: 'create-handler', label: 'handleCreateSubmit() executed' },
  { id: 'create-api', label: 'postApi.createPost() called' },
  { id: 'write-mock', label: 'mockServer write response' },
  { id: 'add-dispatch', label: 'dispatch(ADD_POST)' },
  { id: 'delete-handler', label: 'handleDeleteClick() executed' },
  { id: 'delete-api', label: 'postApi.deletePost() called' },
  { id: 'delete-mock', label: 'mockServer delete response' },
  { id: 'remove-dispatch', label: 'dispatch(REMOVE_POST)' },
  { id: 'render', label: 'list rerendered' },
];

export function ChapterMutationPage() {
  const [title, setTitle] = useState('Reducer action note');
  const [body, setBody] = useState('Mutation requests update Context through dispatch.');
  const { state, fetchPosts, createPost, deletePost } = usePosts();
  const { setActiveChapter } = useCommon();
  const { resetRuntime, runEvents, appendLog, setCallStack } = useRuntime();

  useEffect(() => {
    setActiveChapter('Chapter 4 - Create/Delete Mutation');
    resetRuntime(steps);
    fetchPosts();
  }, [fetchPosts, resetRuntime, setActiveChapter]);

  const handleInput = (field: 'title' | 'body', value: string) => {
    if (field === 'title') {
      setTitle(value);
    } else {
      setBody(value);
    }
    setCallStack(['onChange()', 'setLocalFormState()']);
    appendLog('Handler', `${field} input changed`);
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    await runEvents([
      { stepId: 'create-handler', kind: 'Handler', message: 'handleCreateSubmit() executed', callStack: ['handleCreateSubmit()'] },
      {
        stepId: 'create-api',
        kind: 'API',
        message: 'postApi.createPost() -> axiosClient.post("/posts")',
        callStack: ['handleCreateSubmit()', 'postApi.createPost()', 'axiosClient.post()'],
      },
    ]);
    await createPost({ title, body });
    await runEvents([
      {
        stepId: 'write-mock',
        kind: 'Mock',
        message: 'write mock resolved or rejected from query string config',
        callStack: ['handleCreateSubmit()', 'postApi.createPost()', 'axiosClient.post()', 'mockServer.request()'],
      },
      { stepId: 'add-dispatch', kind: 'Dispatch', message: 'ADD_POST_SUCCESS or POST_MUTATION_FAILURE dispatched' },
      { stepId: 'render', kind: 'Render', message: 'Post list rerendered after create mutation', callStack: [] },
    ]);
  };

  const handleDelete = async (id: number) => {
    await runEvents([
      { stepId: 'delete-handler', kind: 'Handler', message: `handleDeleteClick(${id}) executed`, callStack: ['handleDeleteClick()'] },
      {
        stepId: 'delete-api',
        kind: 'API',
        message: `postApi.deletePost(${id}) -> axiosClient.delete()`,
        callStack: ['handleDeleteClick()', 'postApi.deletePost()', 'axiosClient.delete()'],
      },
    ]);
    await deletePost(id);
    await runEvents([
      {
        stepId: 'delete-mock',
        kind: 'Mock',
        message: 'delete mock resolved or rejected from query string config',
        callStack: ['handleDeleteClick()', 'postApi.deletePost()', 'axiosClient.delete()', 'mockServer.request()'],
      },
      { stepId: 'remove-dispatch', kind: 'Dispatch', message: 'REMOVE_POST_SUCCESS or POST_MUTATION_FAILURE dispatched' },
      { stepId: 'render', kind: 'Render', message: 'Post list rerendered after delete mutation', callStack: [] },
    ]);
  };

  return (
    <LearningLayout title="Chapter 4 - Create/Delete Mutation" subtitle="Create and delete posts through API modules and reducer dispatch.">
      <div className="mini-stack">
        <form className="mini-stack" onSubmit={handleCreate}>
          <label>
            Title
            <input value={title} onChange={(event) => handleInput('title', event.target.value)} />
          </label>
          <label>
            Body
            <textarea value={body} onChange={(event) => handleInput('body', event.target.value)} />
          </label>
          <button type="submit" disabled={state.loading}>
            Create post
          </button>
        </form>
        {state.error && <p className="error-text">{state.error}</p>}
        {state.message && <p className="success-text">{state.message}</p>}
        <ul className="post-list">
          {state.posts.map((post) => (
            <li key={post.id}>
              <strong>{post.title}</strong>
              <span>{post.body}</span>
              <button type="button" onClick={() => handleDelete(post.id)} disabled={state.loading}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </LearningLayout>
  );
}
