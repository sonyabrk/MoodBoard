import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import LoginModal from '../LoginModal/LoginModal'
import type { LoginData } from '../../types'
import './LoginButton.scss'

function LoginButton() {
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
  const [username, setUsername] = useState<string>('')
  const [role, setRole] = useState<string>('')
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const storedUsername = localStorage.getItem('username')
    const storedRole = localStorage.getItem('userRole')
    if (token && storedUsername) {
      setIsLoggedIn(true)
      setUsername(storedUsername)
      setRole(storedRole ?? '')
    }
  }, [])

  const handleLoginSuccess = (data: LoginData): void => {
    localStorage.setItem('authToken', data.access_token)
    localStorage.setItem('userRole', data.role)
    localStorage.setItem('username', data.username)
    setIsLoggedIn(true)
    setUsername(data.username)
    setRole(data.role)
    if (data.role === 'admin') {
      localStorage.setItem('adminToken', data.access_token)
      navigate('/admin', { replace: true })
    } else if (data.role === 'creator') {
      navigate('/creator', { replace: true })
    }
  }

  const handleLogout = (): void => {
    ;['authToken', 'adminToken', 'userRole', 'username'].forEach(k => localStorage.removeItem(k))
    setIsLoggedIn(false)
    setUsername('')
    setRole('')
  }

  const handleLoggedInClick = (): void => {
    if (role === 'admin') navigate('/admin')
    else if (role === 'creator') navigate('/creator')
    else handleLogout()
  }

  if (isLoggedIn) {
    return (
      <div
        className="login-button-logged-in"
        onClick={handleLoggedInClick}
        title={role === 'admin' ? 'Админ-панель' : 'Личный кабинет'}
      >
        <div className="login-avatar">{username.charAt(0).toUpperCase()}</div>
        <div className="login-info">
          <div className="login-username">{username}</div>
          <div className="login-role">{role === 'admin' ? 'Админ' : 'Креатор'}</div>
        </div>
      </div>
    )
  }

  return (
    <>
      <button
        className="login-button"
        onClick={() => setShowLoginModal(true)}
        title="Войти в аккаунт"
      >
        <span className="login-button-icon">●</span>
      </button>
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  )
}

export default LoginButton