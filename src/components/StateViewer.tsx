import { useAuth } from '../context/AuthContext';
import { useCommon } from '../context/CommonContext';
import { usePosts } from '../context/PostContext';

export function StateViewer() {
  const auth = useAuth();
  const posts = usePosts();
  const common = useCommon();

  return (
    <section className="panel state-panel">
      <div className="panel-title">Context State Viewer</div>
      <pre>{JSON.stringify({ CommonContext: common.state, AuthContext: auth.state, PostContext: posts.state }, null, 2)}</pre>
    </section>
  );
}
