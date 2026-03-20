import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './SetPassword.scss'; 

function SetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!token) {
      setError('Ссылка активации недействительна');
    }
  }, [token]);

  useEffect(() => {
    if (!success) return;
    if (countdown === 0) {
      navigate('/', { replace: true });
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [success, countdown, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/creators/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Ошибка при установке пароля');
      }

      setSuccess(true);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="set-password-container success">
        <div className="set-password-box">
          <div className="success-icon">✓</div>
          <h2 className="set-password-title">Пароль установлен!</h2>
          <p className="success-message">
            Теперь вы можете войти в систему с вашим юзернеймом и паролем.
          </p>
          <p className="set-password-subtitle">
            Переход на главную через {countdown}...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="set-password-container">
      <div className="set-password-box">
        <h2 className="set-password-title">Установите пароль</h2>
        <p className="set-password-subtitle">
          Вы получили эту ссылку после одобрения вашей заявки на креаторство
        </p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="set-password-form">
          <div className="form-group">
            <label htmlFor="password">Новый пароль *</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
              placeholder="Введите пароль (минимум 6 символов)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Подтвердите пароль *</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="form-input"
              placeholder="Повторите пароль"
            />
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={loading || !token}
          >
            {loading ? 'Установка...' : 'Установить пароль'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SetPassword;