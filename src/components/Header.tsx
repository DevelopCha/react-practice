import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { reactTrack } from '../data/learningCatalog';
import { useRuntime } from '../runtime/RuntimeContext';

const topLinks = [
  { to: '/', label: 'Home' },
  ...reactTrack.groups.map((group) => ({ to: `/track/react/${group.id}`, label: group.title })),
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
        {topLinks.map((item) => (
          <NavLink key={item.to} to={item.to}>
            {item.label}
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
