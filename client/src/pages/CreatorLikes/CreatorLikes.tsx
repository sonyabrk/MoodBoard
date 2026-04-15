import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './CreatorLikes.scss'

interface LikedBoard {
  like_id: number
  frame_id: number
  frame_title: string
  liked_at: string
}

function CreatorLikes() {
  const navigate = useNavigate()
  const [likes, setLikes] = useState<LikedBoard[]>([])
  const [loading, setLoading] = useState(true)

  const token = localStorage.getItem('authToken')
  const role = localStorage.getItem('userRole')

  useEffect(() => {
    if (!token || role !== 'creator') { navigate('/'); return }
    fetch('http://localhost:8000/api/users/creator-likes', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then((data: LikedBoard[]) => { setLikes(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="cl-loading">загрузка...</div>

  return (
    <div className="cl-page">
      <header className="cl-header">
        <button className="cl-back-btn" onClick={() => navigate(-1)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          назад
        </button>
        <h1 className="cl-title">
          <span className="cl-heart">♥</span>
          Мои лайки
        </h1>
      </header>

      <main className="cl-main">
        {likes.length === 0 ? (
          <div className="cl-empty">
            <span className="cl-empty-icon">♡</span>
            <p>Вы ещё не лайкали мудборды</p>
            <button className="cl-explore-btn" onClick={() => navigate('/')}>
              смотреть мудборды
            </button>
          </div>
        ) : (
          <div className="cl-list">
            {likes.map(like => (
              <div
                key={like.like_id}
                className="cl-item"
                onClick={() => navigate(`/boards/${like.frame_id}`)}
              >
                <div className="cl-item-icon">♥</div>
                <div className="cl-item-info">
                  <span className="cl-item-title">{like.frame_title}</span>
                  <span className="cl-item-date">
                    {new Date(like.liked_at).toLocaleDateString('ru-RU', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </span>
                </div>
                <div className="cl-item-arrow">→</div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default CreatorLikes