import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRuntime } from '../runtime/RuntimeContext';

const chapters = [
  { to: '/chapter/mount-auth', label: 'Ch 1' },
  { to: '/chapter/login', label: 'Ch 2' },
  { to: '/chapter/list', label: 'Ch 3' },
  { to: '/chapter/mutation', label: 'Ch 4' },
];

export function Header() {
  const { state, logout } = useAuth();
  const { appendLog } = useRuntime();

  const handleLogout = () => {
    logout();
    appendLog('Dispatch', 'LOGOUT dispatched');
    appendLog('Render', 'Header rerendered with anonymous session');
  };

  return (
    <header className="app-header">
      <Link className="brand" to="/">
        React Legacy Learning Lab
      </Link>
      <nav className="top-nav">
        {chapters.map((chapter) => (
          <NavLink key={chapter.to} to={chapter.to}>
            {chapter.label}
          </NavLink>
        ))}
      </nav>
      <div className="session-pill">
        <span>{state.isLogin ? state.userInfo?.id : 'guest'}</span>
        {state.isLogin && (
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        )}
      </div>
    </header>
  );
}
