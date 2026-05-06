import { Link } from 'react-router-dom';
import { AuthStateViewer } from '../components/AuthStateViewer';
import { ExecutionConsole } from '../components/ExecutionConsole';
import { FlowVisualizer } from '../components/FlowVisualizer';

const chapters = [
  {
    to: '/chapter/mount-auth',
    number: '01',
    title: 'App Mount & Auth Check',
    body: 'App.tsx mount, useEffect auth init, session restore, AUTH_RESTORE dispatch.',
  },
  {
    to: '/chapter/login',
    number: '02',
    title: 'Login Flow',
    body: 'Controlled inputs, submit handler, API call, reducer success and failure branches.',
  },
  {
    to: '/chapter/list',
    number: '03',
    title: 'Data Fetch List',
    body: 'Page mount fetch, loading, success render, error render, and empty state.',
  },
  {
    to: '/chapter/mutation',
    number: '04',
    title: 'Create/Delete Mutation',
    body: 'Create and delete requests with ADD_POST and REMOVE_POST reducer updates.',
  },
];

export function DashboardPage() {
  return (
    <main className="dashboard-page">
      <section className="dashboard-intro">
        <h1>React Legacy Learning Lab</h1>
        <p>Interactive runtime explorer for Context API, useReducer, Axios, and Promise based mock APIs.</p>
      </section>
      <section className="chapter-cards">
        {chapters.map((chapter) => (
          <Link key={chapter.to} className="chapter-card" to={chapter.to}>
            <span>{chapter.number}</span>
            <h2>{chapter.title}</h2>
            <p>{chapter.body}</p>
          </Link>
        ))}
      </section>
      <section className="startup-runtime-grid">
        <FlowVisualizer />
        <AuthStateViewer />
        <ExecutionConsole />
      </section>
    </main>
  );
}
