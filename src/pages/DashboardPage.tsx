import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { reactTrack } from '../data/learningCatalog';
import { useCommon } from '../context/CommonContext';

export function DashboardPage() {
  const [reactModalOpen, setReactModalOpen] = useState(false);
  const { setActiveChapter } = useCommon();

  useEffect(() => {
    setActiveChapter('Dashboard');
  }, [setActiveChapter]);

  return (
    <main className="dashboard-page">
      <section className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <span className="eyebrow">Executable Learning Playground</span>
          <h1>코드를 읽는 것에서 끝나지 않고, 실행 흐름을 실험하며 배우는 학습 프로그램</h1>
          <p>
            이 프로젝트는 기능 앱 자체보다도 입력, API, reducer, state change, rerender가 어떤 순서와 의미로 연결되는지 학습하기
            위한 범용 베이스 프레임을 목표로 합니다.
          </p>
        </div>
        <div className="dashboard-hero-panel">
          <strong>Program Traits</strong>
          <ul className="spec-bullet-list">
            <li>세션 단위 실험으로 한 번의 클릭을 하나의 학습 흐름으로 다룹니다.</li>
            <li>단순 결과보다 상태 변화 이유와 데이터 변형 과정을 같이 보여줍니다.</li>
            <li>React를 시작점으로 두고, 이후 다른 언어나 구조로도 확장 가능한 학습 프레임을 지향합니다.</li>
          </ul>
        </div>
      </section>

      <section className="track-selection-section">
        <div className="section-heading-row">
          <div>
            <span className="eyebrow">Learning Targets</span>
            <h2>학습할 대상을 선택하세요</h2>
          </div>
        </div>

        <div className="track-card-grid">
          <button type="button" className="track-card-button react-track-card" onClick={() => setReactModalOpen(true)}>
            <span className="track-card-tag">Track 01</span>
            <strong>{reactTrack.title}</strong>
            <p>{reactTrack.tagline}</p>
            <div className="track-card-footer">
              <span>{reactTrack.groups.length} groups</span>
              <span>Open spec</span>
            </div>
          </button>
        </div>
      </section>

      {reactModalOpen && (
        <div className="track-modal-backdrop" role="presentation" onClick={() => setReactModalOpen(false)}>
          <section
            className="track-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="react-track-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="track-modal-header">
              <div>
                <span className="eyebrow">React Track Spec</span>
                <h2 id="react-track-modal-title">{reactTrack.title}</h2>
                <p>{reactTrack.description}</p>
              </div>
              <button type="button" className="modal-close-button" onClick={() => setReactModalOpen(false)}>
                Close
              </button>
            </div>

            <div className="track-modal-grid">
              <section className="panel">
                <div className="panel-title">Spec</div>
                <ul className="spec-bullet-list">
                  {reactTrack.spec.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>

              <section className="panel">
                <div className="panel-title">Learning Groups</div>
                <div className="track-group-list">
                  {reactTrack.groups.map((group) => (
                    <article key={group.id} className="track-group-row">
                      <div>
                        <strong>{group.title}</strong>
                        <p>{group.summary}</p>
                      </div>
                      <Link className="track-group-link" to={`/track/react/${group.id}`} onClick={() => setReactModalOpen(false)}>
                        Open
                      </Link>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
