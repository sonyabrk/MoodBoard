import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreatorDashboard.scss';

const API = 'http://localhost:8000';

function CreatorDashboard() {
  const navigate = useNavigate();
  const [creator, setCreator] = useState(null);
  const [frames, setFrames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewFrame, setShowNewFrame] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const token = localStorage.getItem('authToken');

  useEffect(() => {
    if (!token) { navigate('/'); return; }

    const role = localStorage.getItem('userRole');
    if (role !== 'creator') { navigate('/'); return; }

    Promise.all([
      fetch(`${API}/api/creators/me`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.ok ? r.json() : null),
      fetch(`${API}/api/creators/me/frames`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.ok ? r.json() : [])
    ]).then(([profile, myFrames]) => {
      if (!profile) { navigate('/'); return; }
      setCreator(profile);
      setFrames(Array.isArray(myFrames) ? myFrames : []);
      setLoading(false);
    }).catch(() => { navigate('/'); });
  }, [navigate, token]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    navigate('/');
  };

  const handleCreateFrame = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    const body = new FormData();
    body.append('title', newTitle.trim());
    body.append('description', newDesc.trim());
    body.append('layout', '{}');
    body.append('is_published', 'true');

    try {
      const r = await fetch(`${API}/api/creators/me/frames`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body
      });
      if (r.ok) {
        const data = await r.json();
        setFrames(prev => [{ id: data.id, title: newTitle, description: newDesc,
          is_published: true, created_at: new Date().toISOString(), tags: [] }, ...prev]);
        setNewTitle('');
        setNewDesc('');
        setShowNewFrame(false);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (frameId) => {
    if (!window.confirm('Удалить мудборд?')) return;
    const r = await fetch(`${API}/api/creators/me/frames/${frameId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (r.ok) setFrames(prev => prev.filter(f => f.id !== frameId));
  };

  const handleTogglePublish = async (frameId) => {
    const r = await fetch(`${API}/api/creators/me/frames/${frameId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (r.ok) {
      const data = await r.json();
      setFrames(prev => prev.map(f =>
        f.id === frameId ? { ...f, is_published: data.is_published } : f
      ));
    }
  };

  if (loading) return <div className="creator-loading">загрузка...</div>;

  return (
    <div className="creator-dashboard">

      <aside className="creator-sidebar">
        <button className="creator-back-btn" onClick={() => navigate('/')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          плэйн
        </button>

        <div className="creator-profile">
          <div className="creator-avatar">
            {creator.first_name?.charAt(0).toUpperCase()}
          </div>
          <div className="creator-name">
            {creator.first_name} {creator.last_name}
          </div>
          <div className="creator-username">@{creator.username}</div>
          {creator.portfolio_url && (
            <a
              href={creator.portfolio_url}
              target="_blank"
              rel="noopener noreferrer"
              className="creator-portfolio-link"
            >
              портфолио ↗
            </a>
          )}
        </div>

        <div className="creator-stats">
          <div className="creator-stat">
            <span className="creator-stat-num">{frames.length}</span>
            <span className="creator-stat-label">мудбордов</span>
          </div>
          <div className="creator-stat">
            <span className="creator-stat-num">
              {frames.filter(f => f.is_published).length}
            </span>
            <span className="creator-stat-label">опубликовано</span>
          </div>
        </div>

        <button className="creator-logout-btn" onClick={handleLogout}>
          выйти
        </button>
      </aside>

      {/* Основной контент */}
      <main className="creator-main">
        <div className="creator-main-header">
          <h1 className="creator-main-title">мои мудборды</h1>
          <button
            className="creator-add-btn"
            onClick={() => setShowNewFrame(true)}
          >
            + новый мудборд
          </button>
        </div>

        {/* Форма создания */}
        {showNewFrame && (
          <div className="creator-new-frame">
            <input
              autoFocus
              className="creator-input"
              placeholder="название мудборда"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateFrame()}
            />
            <input
              className="creator-input"
              placeholder="описание (необязательно)"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
            />
            <div className="creator-new-frame-actions">
              <button
                className="creator-btn creator-btn--primary"
                onClick={handleCreateFrame}
                disabled={creating || !newTitle.trim()}
              >
                {creating ? 'создаю...' : 'создать'}
              </button>
              <button
                className="creator-btn creator-btn--ghost"
                onClick={() => { setShowNewFrame(false); setNewTitle(''); setNewDesc(''); }}
              >
                отмена
              </button>
            </div>
          </div>
        )}

        {/* Сетка мудбордов */}
        {frames.length === 0 && !showNewFrame && (
          <div className="creator-empty">
            <p>у вас пока нет мудбордов</p>
            <button className="creator-add-btn" onClick={() => setShowNewFrame(true)}>
              создать первый
            </button>
          </div>
        )}

        <div className="creator-frames-grid">
          {frames.map(frame => (
            <div key={frame.id} className={`creator-frame-card ${!frame.is_published ? 'draft' : ''}`}>
              <div className="creator-frame-thumb" />
              <div className="creator-frame-info">
                <div className="creator-frame-top">
                  <span className="creator-frame-title">{frame.title}</span>
                  <span className={`creator-frame-badge ${frame.is_published ? 'published' : 'draft'}`}>
                    {frame.is_published ? 'опубликован' : 'черновик'}
                  </span>
                </div>
                {frame.description && (
                  <p className="creator-frame-desc">{frame.description}</p>
                )}
                {frame.tags?.length > 0 && (
                  <div className="creator-frame-tags">
                    {frame.tags.map(t => (
                      <span key={t.id} className="creator-frame-tag">{t.name}</span>
                    ))}
                  </div>
                )}
                <div className="creator-frame-actions">
                  <button
                    className="creator-btn creator-btn--ghost"
                    onClick={() => handleTogglePublish(frame.id)}
                  >
                    {frame.is_published ? 'скрыть' : 'опубликовать'}
                  </button>
                  <button
                    className="creator-btn creator-btn--danger"
                    onClick={() => handleDelete(frame.id)}
                  >
                    удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default CreatorDashboard;