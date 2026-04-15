import { useState } from 'react'
import type { LoginModalProps, LoginData } from '../../types'
import './LoginModal.scss'

function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login')

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginRole, setLoginRole] = useState<'creator' | 'user'>('creator')

  const [regUsername, setRegUsername] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regShowPassword, setRegShowPassword] = useState(false)

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const loginUrl = loginRole === 'creator'
        ? 'http://localhost:8000/api/creators/login'
        : 'http://localhost:8000/api/users/login'

      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username, password }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Ошибка входа')
      }
      const data: LoginData = await response.json()
      localStorage.setItem('authToken', data.access_token)
      localStorage.setItem('userRole', data.role)
      localStorage.setItem('username', data.username)
      onLoginSuccess(data)
      onClose()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: regUsername, email: regEmail, password: regPassword }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Ошибка регистрации')
      }
      const data = await response.json()
      localStorage.setItem('authToken', data.access_token)
      localStorage.setItem('userRole', data.role)
      localStorage.setItem('username', data.username)
      onLoginSuccess(data as LoginData)
      onClose()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="login-modal-overlay" onClick={onClose}>
      <div className="login-modal-content" onClick={e => e.stopPropagation()}>
        <button className="login-modal-close" onClick={onClose}>✕</button>

        <div className="login-modal-header">
          <div className="login-icon">●</div>
          <h2 className="login-title">
            {tab === 'login' ? 'Вход в аккаунт' : 'Регистрация'}
          </h2>
          <p className="login-subtitle">
            {tab === 'login' ? 'Войдите как админ, креатор или зритель' : 'Создайте аккаунт зрителя'}
          </p>
        </div>

        <div className="login-tabs">
          <button
            type="button"
            className={`login-tab${tab === 'login' ? ' login-tab--active' : ''}`}
            onClick={() => { setTab('login'); setError('') }}
          >
            Вход
          </button>
          <button
            type="button"
            className={`login-tab${tab === 'register' ? ' login-tab--active' : ''}`}
            onClick={() => { setTab('register'); setError('') }}
          >
            Регистрация
          </button>
        </div>

        {error && <div className="login-error">{error}</div>}

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="login-form">
            <div className="login-form-group">
              <label htmlFor="username" className="login-label">Юзернейм *</label>
              <input type="text" id="username" value={username}
                onChange={e => setUsername(e.target.value)}
                required className="login-input" placeholder="Введите ваш юзернейм" autoComplete="username" />
            </div>
            <div className="login-form-group">
              <label htmlFor="password" className="login-label">Пароль *</label>
              <div className="login-password-wrapper">
                <input type={showPassword ? 'text' : 'password'} id="password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  required className="login-input" placeholder="Введите пароль" autoComplete="current-password" />
                <button type="button" className="login-toggle-password" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? '🔒' : '🔓'}
                </button>
              </div>
            </div>
            <div className="login-role-selector">
              <label className="login-radio">
                <input
                  type="radio"
                  name="loginRole"
                  value="creator"
                  checked={loginRole === 'creator'}
                  onChange={() => setLoginRole('creator')}
                />
                Креатор / Админ
              </label>
              <label className="login-radio">
                <input
                  type="radio"
                  name="loginRole"
                  value="user"
                  checked={loginRole === 'user'}
                  onChange={() => setLoginRole('user')}
                />
                Зритель
              </label>
            </div>
            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="login-form">
            <div className="login-form-group">
              <label className="login-label">Юзернейм *</label>
              <input type="text" value={regUsername}
                onChange={e => setRegUsername(e.target.value)}
                required className="login-input" placeholder="минимум 3 символа" autoComplete="username" />
            </div>
            <div className="login-form-group">
              <label className="login-label">Email *</label>
              <input type="email" value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
                required className="login-input" placeholder="your@email.com" autoComplete="email" />
            </div>
            <div className="login-form-group">
              <label className="login-label">Пароль *</label>
              <div className="login-password-wrapper">
                <input type={regShowPassword ? 'text' : 'password'} value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  required className="login-input" placeholder="минимум 6 символов, хотя бы 1 буква"
                  autoComplete="new-password" />
                <button type="button" className="login-toggle-password" onClick={() => setRegShowPassword(!regShowPassword)}>
                  {regShowPassword ? '🔒' : '🔓'}
                </button>
              </div>
            </div>
            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? 'Создаём...' : 'Зарегистрироваться'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default LoginModal