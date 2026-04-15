import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './UserProfile.scss'

interface LikedBoard {
  like_id: number
  frame_id: number
  frame_title: string
  liked_at: string
}

function UserProfile() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [likes, setLikes] = useState<LikedBoard[]>([])
  const [loading, setLoading] = useState(true)

  const token = localStorage.getItem('authToken')
  const role = localStorage.getItem('userRole')

  useEffect(() => {
    if (!token || role !== 'user') {
      navigate('/')
      return
    }
    const storedUsername = localStorage.getItem('username') || ''
    setUsername(storedUsername)

    fetch('http://localhost:8000/api/users/me/likes', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then((data: LikedBoard[]) => { setLikes(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleLogout = () => {
    ;['authToken', 'adminToken', 'userRole', 'username'].forEach(k => localStorage.removeItem(k))
    navigate('/')
  }

  if (loading) return <div className="uc-loading">загрузка...</div>

  return (
    <div className="uc-page">
      <header className="uc-header">
        <button className="uc-back-btn" onClick={() => navigate(-1)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          назад
        </button>

        <div className="uc-profile">
          <div className="uc-avatar">{username.charAt(0).toUpperCase()}</div>
          <div className="uc-info">
            <h1 className="uc-username">@{username}</h1>
            <span className="uc-role-badge">зритель</span>
          </div>
          <button className="uc-logout-btn" onClick={handleLogout}>выйти</button>
        </div>
      </header>

      <main className="uc-main">
        <h2 className="uc-section-title">
          <span className="uc-heart">♥</span>
          Лайки
          <span className="uc-count">{likes.length}</span>
        </h2>

        {likes.length === 0 ? (
          <div className="uc-empty">
            <span className="uc-empty-icon">♡</span>
            <p>Вы ещё не лайкали мудборды</p>
            <button className="uc-explore-btn" onClick={() => navigate('/')}>
              смотреть мудборды
            </button>
          </div>
        ) : (
          <div className="uc-likes-list">
            {likes.map(like => (
              <div
                key={like.like_id}
                className="uc-like-item"
                onClick={() => navigate(`/boards/${like.frame_id}`)}
              >
                <div className="uc-like-icon">♥</div>
                <div className="uc-like-info">
                  <span className="uc-like-title">{like.frame_title}</span>
                  <span className="uc-like-date">
                    {new Date(like.liked_at).toLocaleDateString('ru-RU', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </span>
                </div>
                <div className="uc-like-arrow">→</div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default UserProfile