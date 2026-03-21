import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './AdminLogin.scss'

function AdminLogin() {
  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Ошибка авторизации')
      }
      const data = await response.json()
      localStorage.setItem('adminToken', data.access_token)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login-container">
      <div className="admin-login-box">
        <button className="admin-login-back" onClick={() => navigate('/')}>← На главную</button>
        <h1 className="admin-login-title">Админ-панель • плэйн</h1>
        {error && <div className="admin-login-error">{error}</div>}
        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="form-group">
            <label htmlFor="username">Логин</label>
            <input type="text" id="username" value={username}
              onChange={e => setUsername(e.target.value)}
              required className="form-input" placeholder="admin" />
          </div>
          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input type="password" id="password" value={password}
              onChange={e => setPassword(e.target.value)}
              required className="form-input" placeholder="••••••••" />
          </div>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AdminLogin