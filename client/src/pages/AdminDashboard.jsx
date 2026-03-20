import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.scss';

function AdminDashboard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [activationLink, setActivationLink] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) { navigate('/admin/login', { replace: true }); return; }

    fetch('http://localhost:8000/api/admin/creators/applications', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => { if (!res.ok) throw new Error('Не авторизован'); return res.json(); })
      .then(data => { setApplications(data); setLoading(false); })
      .catch(err => {
        setError(err.message);
        setLoading(false);
        localStorage.removeItem('adminToken');
        navigate('/admin/login', { replace: true });
      });
  }, [navigate]);

  const handleApprove = (app) => { setSelectedApp(app); setShowApproveModal(true); };

  const confirmApprove = () => {
    const token = localStorage.getItem('adminToken');
    fetch(`http://localhost:8000/api/admin/creators/applications/${selectedApp.id}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    })
      .then(res => res.json())
      .then(data => {
        setApplications(apps =>
          apps.map(a => a.id === selectedApp.id ? { ...a, status: 'approved' } : a)
        );
        setShowApproveModal(false);
        setActivationLink(data.activation_link);
        setShowLinkModal(true);
        setCopied(false);
      })
      .catch(err => alert('Ошибка: ' + err.message));
  };

  const handleReject = (app) => { setSelectedApp(app); setShowRejectModal(true); };

  const confirmReject = () => {
    const token = localStorage.getItem('adminToken');
    fetch(`http://localhost:8000/api/admin/creators/applications/${selectedApp.id}/reject`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    })
      .then(res => res.json())
      .then(() => {
        setApplications(apps =>
          apps.map(a => a.id === selectedApp.id ? { ...a, status: 'rejected' } : a)
        );
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

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    navigate('/', { replace: true });
  };

  if (loading) return <div className="admin-loading">Загрузка заявок...</div>;
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

      <main className="admin-main">
        <h2>Заявки на креаторство</h2>

        {applications.length === 0 ? (
          <div className="no-applications"><p>Нет новых заявок</p></div>
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
                  <td>
                    <a href={app.portfolio_url} target="_blank" rel="noopener noreferrer" className="portfolio-link">
                      Открыть
                    </a>
                  </td>
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
                        <button onClick={() => handleReject(app)} className="action-btn reject-btn">- Отклонить</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>

      {/* Модал подтверждения одобрения */}
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

      {/* Модал со ссылкой активации */}
      {showLinkModal && (
        <div className="admin-modal-overlay" onClick={() => setShowLinkModal(false)}>
          <div className="admin-modal-content link-modal" onClick={e => e.stopPropagation()}>
            <div className="link-modal-icon">✓</div>
            <h3>Заявка одобрена!</h3>
            <p className="link-modal-hint">
              Отправьте эту ссылку пользователю — через телеграм, почту или любым удобным способом
            </p>

            <div className="link-box">
              <span className="link-text">{activationLink}</span>
            </div>

            <button
              className={`copy-btn ${copied ? 'copied' : ''}`}
              onClick={handleCopyLink}
            >
              {copied ? '✓ скопировано' : 'скопировать ссылку'}
            </button>

            <button
              className="modal-btn cancel-btn"
              style={{ marginTop: '12px' }}
              onClick={() => setShowLinkModal(false)}
            >
              закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;