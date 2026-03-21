import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.scss';

const API = 'http://localhost:8000';

function AdminDashboard() {
  const [tab, setTab] = useState('applications'); 
  const [applications, setApplications] = useState([]);
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedApp, setSelectedApp] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [activationLink, setActivationLink] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const [selectedCreator, setSelectedCreator] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');

  const fetchApplications = useCallback(() => {
    fetch(`${API}/api/admin/creators/applications`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => { if (!r.ok) throw new Error('Не авторизован'); return r.json(); })
      .then(data => { setApplications(data); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); navigate('/admin/login', { replace: true }); });
  }, [token, navigate]);
 
  const fetchCreators = useCallback(() => {
    fetch(`${API}/api/admin/creators`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setCreators(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token) { navigate('/admin/login', { replace: true }); return; }
    fetchApplications();
    fetchCreators();
  }, [token, navigate, fetchApplications, fetchCreators]);

  const handleApprove = (app) => { setSelectedApp(app); setShowApproveModal(true); };

  const confirmApprove = () => {
    fetch(`${API}/api/admin/creators/applications/${selectedApp.id}/approve`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    })
      .then(r => r.json())
      .then(data => {
        setApplications(apps => apps.map(a => a.id === selectedApp.id ? { ...a, status: 'approved' } : a));
        setShowApproveModal(false);
        setActivationLink(data.activation_link);
        setShowLinkModal(true);
        setCopied(false);
        fetchCreators();
      })
      .catch(err => alert('Ошибка: ' + err.message));
  };

  const handleReject = (app) => { setSelectedApp(app); setShowRejectModal(true); };

  const confirmReject = () => {
    fetch(`${API}/api/admin/creators/applications/${selectedApp.id}/reject`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    })
      .then(r => r.json())
      .then(() => {
        setApplications(apps => apps.map(a => a.id === selectedApp.id ? { ...a, status: 'rejected' } : a));
        setShowRejectModal(false);
      })
      .catch(err => alert('Ошибка: ' + err.message));
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(activationLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleDeleteCreator = (creator) => { setSelectedCreator(creator); setShowDeleteModal(true); };

  const confirmDeleteCreator = () => {
    fetch(`${API}/api/admin/creators/${selectedCreator.id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(() => {
        setCreators(prev => prev.filter(c => c.id !== selectedCreator.id));
        setShowDeleteModal(false);
        setSelectedCreator(null);
      })
      .catch(err => alert('Ошибка: ' + err.message));
  };

  const handleToggleActive = (creator) => {
    fetch(`${API}/api/admin/creators/${creator.id}/toggle`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => setCreators(prev => prev.map(c => c.id === data.id ? { ...c, is_active: data.is_active } : c)))
      .catch(err => alert('Ошибка: ' + err.message));
  };

  const handleLogout = () => {
    ['adminToken', 'authToken', 'userRole', 'username'].forEach(k => localStorage.removeItem(k));
    navigate('/', { replace: true });
  };

  if (loading) return <div className="admin-loading">Загрузка...</div>;
  if (error) return <div className="admin-error">Ошибка: {error}</div>;

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-left">
          <button className="admin-back-btn" onClick={() => navigate('/')}>← На главную</button>
          <h1>Админ-панель • плэйн</h1>
        </div>
        <button onClick={handleLogout} className="admin-logout-btn">Выйти</button>
      </header>

      {/* Вкладки */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${tab === 'applications' ? 'active' : ''}`}
          onClick={() => setTab('applications')}
        >
          Заявки
          {applications.filter(a => a.status === 'pending').length > 0 && (
            <span className="admin-tab-badge">
              {applications.filter(a => a.status === 'pending').length}
            </span>
          )}
        </button>
        <button
          className={`admin-tab ${tab === 'creators' ? 'active' : ''}`}
          onClick={() => setTab('creators')}
        >
          Креаторы
          <span className="admin-tab-badge">{creators.length}</span>
        </button>
      </div>

      <main className="admin-main">

        {/* ── Вкладка заявок ── */}
        {tab === 'applications' && (
          <>
            <h2>Заявки на креаторство</h2>
            {applications.length === 0 ? (
              <div className="no-applications"><p>Нет заявок</p></div>
            ) : (
              <table className="applications-table">
                <thead>
                  <tr>
                    <th>Имя</th><th>Юзернейм</th><th>Почта</th>
                    <th>Портфолио</th><th>Дата</th><th>Статус</th><th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map(app => (
                    <tr key={app.id} className={`app-row status-${app.status}`}>
                      <td>{app.first_name} {app.last_name}</td>
                      <td>@{app.username}</td>
                      <td>{app.email}</td>
                      <td><a href={app.portfolio_url} target="_blank" rel="noopener noreferrer" className="portfolio-link">Открыть</a></td>
                      <td>{new Date(app.created_at).toLocaleDateString()}</td>
                      <td>
                        <span className={`status-badge status-${app.status}`}>
                          {app.status === 'pending' ? 'Ожидает' : app.status === 'approved' ? 'Одобрено' : 'Отклонено'}
                        </span>
                      </td>
                      <td>
                        {app.status === 'pending' && (
                          <div className="actions-cell">
                            <button onClick={() => handleApprove(app)} className="action-btn approve-btn">+ Одобрить</button>
                            <button onClick={() => handleReject(app)} className="action-btn reject-btn">− Отклонить</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        {/* ── Вкладка креаторов ── */}
        {tab === 'creators' && (
          <>
            <h2>Аккаунты креаторов</h2>
            {creators.length === 0 ? (
              <div className="no-applications"><p>Нет зарегистрированных креаторов</p></div>
            ) : (
              <table className="applications-table">
                <thead>
                  <tr>
                    <th>Имя</th><th>Юзернейм</th><th>Почта</th>
                    <th>Мудбордов</th><th>Дата</th><th>Статус</th><th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {creators.map(c => (
                    <tr key={c.id} className={`app-row ${!c.is_active ? 'status-rejected' : ''}`}>
                      <td>{c.first_name} {c.last_name}</td>
                      <td>@{c.username}</td>
                      <td>{c.email}</td>
                      <td>{c.frames_count}</td>
                      <td>{new Date(c.created_at).toLocaleDateString()}</td>
                      <td>
                        <span className={`status-badge ${c.is_active ? 'status-approved' : 'status-rejected'}`}>
                          {c.is_active ? 'Активен' : 'Заблокирован'}
                        </span>
                      </td>
                      <td>
                        <div className="actions-cell">
                          <button
                            onClick={() => handleToggleActive(c)}
                            className={`action-btn ${c.is_active ? 'reject-btn' : 'approve-btn'}`}
                          >
                            {c.is_active ? 'Заблокировать' : 'Разблокировать'}
                          </button>
                          <button
                            onClick={() => handleDeleteCreator(c)}
                            className="action-btn delete-btn"
                          >
                            Удалить
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </main>

      {/* Модал одобрения */}
      {showApproveModal && (
        <div className="admin-modal-overlay" onClick={() => setShowApproveModal(false)}>
          <div className="admin-modal-content" onClick={e => e.stopPropagation()}>
            <h3>Одобрить заявку @{selectedApp?.username}?</h3>
            <p>Будет сгенерирована ссылка для установки пароля.</p>
            <div className="modal-actions">
              <button onClick={confirmApprove} className="modal-btn approve-btn">Да, одобрить</button>
              <button onClick={() => setShowApproveModal(false)} className="modal-btn cancel-btn">Отмена</button>
            </div>
          </div>
        </div>
      )}

      {/* Модал отклонения */}
      {showRejectModal && (
        <div className="admin-modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="admin-modal-content" onClick={e => e.stopPropagation()}>
            <h3>Отклонить заявку @{selectedApp?.username}?</h3>
            <p>Пользователь не получит доступ к платформе.</p>
            <div className="modal-actions">
              <button onClick={confirmReject} className="modal-btn reject-btn">Да, отклонить</button>
              <button onClick={() => setShowRejectModal(false)} className="modal-btn cancel-btn">Отмена</button>
            </div>
          </div>
        </div>
      )}

      {/* Модал ссылки активации */}
      {showLinkModal && (
        <div className="admin-modal-overlay" onClick={() => setShowLinkModal(false)}>
          <div className="admin-modal-content link-modal" onClick={e => e.stopPropagation()}>
            <div className="link-modal-icon">✓</div>
            <h3>Заявка одобрена!</h3>
            <p className="link-modal-hint">Отправьте эту ссылку пользователю</p>
            <div className="link-box"><span className="link-text">{activationLink}</span></div>
            <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopyLink}>
              {copied ? '✓ скопировано' : 'скопировать ссылку'}
            </button>
            <button className="modal-btn cancel-btn" style={{ marginTop: '12px' }} onClick={() => setShowLinkModal(false)}>
              закрыть
            </button>
          </div>
        </div>
      )}

      {/* Модал удаления креатора */}
      {showDeleteModal && (
        <div className="admin-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="admin-modal-content" onClick={e => e.stopPropagation()}>
            <h3>Удалить аккаунт @{selectedCreator?.username}?</h3>
            <p style={{ color: '#ff6b6b', marginTop: 8 }}>
              Это действие необратимо. Все мудборды пользователя будут удалены.
            </p>
            <div className="modal-actions">
              <button onClick={confirmDeleteCreator} className="modal-btn delete-btn">Да, удалить</button>
              <button onClick={() => setShowDeleteModal(false)} className="modal-btn cancel-btn">Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;