import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import BoardPreview from '../components/BoardPreview/BoardPreview'
import type { CreatorPublic } from '../types'
import './CreatorProfile.scss'

const API = 'http://localhost:8000'

function CreatorProfile() {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const [creator, setCreator] = useState<CreatorPublic | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (!username) return
    fetch(`${API}/api/profiles/${username}`)
      .then(r => { if (!r.ok) throw new Error('Креатор не найден'); return r.json() })
      .then((data: CreatorPublic) => { setCreator(data); setLoading(false) })
      .catch((err: Error) => { setError(err.message); setLoading(false) })
  }, [username])

  if (loading) return <div className="cp-loading">загрузка...</div>
  if (error || !creator) return (
    <div className="cp-error">
      <p>{error || 'Не найдено'}</p>
      <button onClick={() => navigate(-1)}>← назад</button>
    </div>
  )

  return (
    <div className="cp-page">
      <header className="cp-header">
        <button className="cp-back-btn" onClick={() => navigate(-1)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          назад
        </button>
        <div className="cp-profile">
          <div className="cp-avatar">{creator.first_name?.charAt(0).toUpperCase()}</div>
          <div className="cp-info">
            <h1 className="cp-name">{creator.first_name} {creator.last_name}</h1>
            <span className="cp-username">@{creator.username}</span>
            {creator.portfolio_url && (
              <a href={creator.portfolio_url} target="_blank" rel="noopener noreferrer" className="cp-portfolio">
                портфолио ↗
              </a>
            )}
          </div>
          <div className="cp-stat">
            <span className="cp-stat-num">{creator.frames.length}</span>
            <span className="cp-stat-label">мудбордов</span>
          </div>
        </div>
      </header>

      <main className="cp-main">
        {creator.frames.length === 0 ? (
          <div className="cp-empty">нет опубликованных мудбордов</div>
        ) : (
          <div className="cp-grid">
            {creator.frames.map(frame => (
              <div key={frame.id} className="cp-card" onClick={() => navigate(`/boards/${frame.id}`)}>
                <div className="cp-card-preview"><BoardPreview layout={frame.layout} /></div>
                <div className="cp-card-info">
                  <span className="cp-card-title">{frame.title}</span>
                  {frame.tags?.length > 0 && (
                    <div className="cp-card-tags">
                      {frame.tags.slice(0, 3).map(t => (
                        <span key={t.id} className="cp-card-tag">{t.name}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default CreatorProfile