import { useAuthState } from '../context/AuthContext';

export function AuthStateViewer() {
  const authState = useAuthState();

  return (
    <section className="panel auth-state-panel">
      <div className="panel-title">Live Auth State Viewer</div>
      <pre>{JSON.stringify(authState, null, 2)}</pre>
    </section>
  );
}
