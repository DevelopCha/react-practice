import { FormEvent, useEffect, useState } from 'react';
import { LearningLayout } from '../components/LearningLayout';
import { useAuth } from '../context/AuthContext';
import { useCommon } from '../context/CommonContext';
import { useRuntime } from '../runtime/RuntimeContext';
import type { FlowStep } from '../types/runtime';

const steps: FlowStep[] = [
  { id: 'mount', label: 'LoginPage mounted' },
  { id: 'input', label: 'controlled input state changed' },
  { id: 'handler', label: 'handleLoginSubmit() executed' },
  { id: 'api', label: 'authApi.login() called' },
  { id: 'axios', label: 'axiosClient.post() requested' },
  { id: 'mock', label: 'mockServer returns response' },
  { id: 'dispatch', label: 'dispatch(LOGIN_SUCCESS)' },
  { id: 'reducer', label: 'authReducer updates state' },
  { id: 'render', label: 'rerender triggered' },
];

export function ChapterLoginPage() {
  const [id, setId] = useState('admin');
  const [password, setPassword] = useState('1234');
  const { state, login } = useAuth();
  const { setActiveChapter } = useCommon();
  const { resetRuntime, runEvents, appendLog, setCallStack } = useRuntime();

  useEffect(() => {
    setActiveChapter('Chapter 2 - Login Flow');
    resetRuntime(steps);
    runEvents([{ stepId: 'mount', kind: 'Mount', message: 'LoginPage mounted' }]);
  }, [resetRuntime, runEvents, setActiveChapter]);

  const handleInput = (field: 'id' | 'password', value: string) => {
    if (field === 'id') {
      setId(value);
    } else {
      setPassword(value);
    }
    setCallStack(['onChange()', 'setLocalFormState()']);
    appendLog('Handler', `${field} controlled input state changed`);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await runEvents([
      { stepId: 'handler', kind: 'Handler', message: 'handleLoginSubmit() executed', callStack: ['handleLoginSubmit()'] },
      { stepId: 'api', kind: 'API', message: 'authApi.login() called', callStack: ['handleLoginSubmit()', 'authApi.login()'] },
      {
        stepId: 'axios',
        kind: 'API',
        message: 'axiosClient.post("/login") requested',
        callStack: ['handleLoginSubmit()', 'authApi.login()', 'axiosClient.post()'],
      },
    ]);
    await login({ id, password });
    await runEvents([
      {
        stepId: 'mock',
        kind: 'Mock',
        message: 'login mock resolved or rejected from query string config',
        callStack: ['handleLoginSubmit()', 'authApi.login()', 'axiosClient.post()', 'mockServer.request()'],
      },
      { stepId: 'dispatch', kind: 'Dispatch', message: 'LOGIN_SUCCESS or LOGIN_FAILURE dispatched' },
      { stepId: 'reducer', kind: 'Reducer', message: 'authReducer updated AuthContext state' },
      { stepId: 'render', kind: 'Render', message: 'LoginPage and Header rerendered', callStack: [] },
    ]);
  };

  return (
    <LearningLayout title="Chapter 2 - Login Flow" subtitle="Submit a controlled form and follow the Context update path.">
      <form className="mini-stack" onSubmit={handleSubmit}>
        <label>
          ID
          <input value={id} onChange={(event) => handleInput('id', event.target.value)} />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(event) => handleInput('password', event.target.value)} />
        </label>
        <button type="submit" disabled={state.loading}>
          {state.loading ? 'Logging in...' : 'Login'}
        </button>
        {state.message && <p className="success-text">{state.message}</p>}
        {state.error && <p className="error-text">{state.error}</p>}
      </form>
    </LearningLayout>
  );
}
