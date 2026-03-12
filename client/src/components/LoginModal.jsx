import { useState } from 'react';
import './LoginModal.scss';

function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/creators/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username,
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Ошибка входа');
      }

      const data = await response.json();
      
      // Сохраняем токен и роль
      localStorage.setItem('authToken', data.access_token);
      localStorage.setItem('userRole', data.role);
      localStorage.setItem('username', data.username);
      
      // Успешный вход
      onLoginSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="login-modal-overlay" onClick={onClose}>
      <div className="login-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="login-modal-close" onClick={onClose}>
          ✕
        </button>
        
        <div className="login-modal-header">
          <div className="login-icon">●</div>
          <h2 className="login-title">Вход в аккаунт</h2>
          <p className="login-subtitle">
            Войдите как админ или креатор
          </p>
        </div>

        {error && <div className="login-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-form-group">
            <label htmlFor="username" className="login-label">
              Юзернейм *
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="login-input"
              placeholder="Введите ваш юзернейм"
              autoComplete="username"
            />
          </div>

          <div className="login-form-group">
            <label htmlFor="password" className="login-label">
              Пароль *
            </label>
            <div className="login-password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="login-input"
                placeholder="Введите пароль"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '🔒' : '🔓'}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="login-submit-btn"
            disabled={loading}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginModal;