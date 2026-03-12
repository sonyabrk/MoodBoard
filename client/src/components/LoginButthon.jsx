import { useState, useEffect } from 'react';
import LoginModal from './LoginModal';
import './LoginButton.scss';

function LoginButton() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const storedUsername = localStorage.getItem('username');
    const storedRole = localStorage.getItem('userRole');
    
    if (token && storedUsername) {
      setIsLoggedIn(true);
      setUsername(storedUsername);
      setRole(storedRole);
    }
  }, []);

  useState(() => {
    const token = localStorage.getItem('authToken');
    const storedUsername = localStorage.getItem('username');
    const storedRole = localStorage.getItem('userRole');
    
    if (token && storedUsername) {
      setIsLoggedIn(true);
      setUsername(storedUsername);
      setRole(storedRole);
    }
  }, []);

  const handleLoginSuccess = (data) => {
    setIsLoggedIn(true);
    setUsername(data.username);
    setRole(data.role);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    setIsLoggedIn(false);
    setUsername('');
    setRole('');
  };

  if (isLoggedIn) {
    return (
      <div className="login-button-logged-in" onClick={handleLogout}>
        <div className="login-avatar">
          {username.charAt(0).toUpperCase()}
        </div>
        <div className="login-info">
          <div className="login-username">{username}</div>
          <div className="login-role">{role === 'admin' ? 'Админ' : 'Креатор'}</div>
        </div>
      </div>
    );
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
  );
}

export default LoginButton;