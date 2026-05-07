import { Link, Navigate, useParams } from 'react-router-dom';
import { reactTrack, getReactGroup } from '../data/learningCatalog';
import { useCommon } from '../context/CommonContext';
import { useEffect } from 'react';

export function ReactTrackGroupPage() {
  const { groupId } = useParams();
  const { setActiveChapter } = useCommon();
  const group = groupId ? getReactGroup(groupId) : null;

  useEffect(() => {
    if (group) {
      setActiveChapter(`React - ${group.title}`);
    }
  }, [group, setActiveChapter]);

  if (!groupId) {
    return <Navigate to="/" replace />;
  }

  if (!group) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="track-group-page">
      <section className="track-group-hero">
        <div>
          <span className="eyebrow">React Learning Group</span>
          <h1>{group.title}</h1>
          <p>{group.summary}</p>
        </div>
        <div className="track-group-badge">
          <strong>{reactTrack.title}</strong>
          <span>{group.intent}</span>
        </div>
      </section>

      <section className="track-group-layout">
        <aside className="panel track-spec-panel">
          <div className="panel-title">React Spec</div>
          <p>{reactTrack.description}</p>
          <ul className="spec-bullet-list">
            {reactTrack.spec.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </aside>

        <section className="track-feature-panel">
          <div className="track-feature-header">
            <div>
              <span className="eyebrow">Learning Features</span>
              <h2>{group.title} 세부 기능</h2>
            </div>
            <Link className="ghost-link-button" to="/">
              Back to tracks
            </Link>
          </div>

          <div className="track-feature-grid">
            {group.features.map((feature) =>
              feature.to ? (
                <Link key={feature.id} className="feature-card ready" to={feature.to}>
                  <div className="feature-card-header">
                    <strong>{feature.title}</strong>
                    <span>ready</span>
                  </div>
                  <p>{feature.description}</p>
                  <span className="feature-card-link">Open lesson</span>
                </Link>
              ) : (
                <article key={feature.id} className="feature-card planned">
                  <div className="feature-card-header">
                    <strong>{feature.title}</strong>
                    <span>planned</span>
                  </div>
                  <p>{feature.description}</p>
                  <span className="feature-card-link muted">Page will be added next</span>
                </article>
              ),
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
