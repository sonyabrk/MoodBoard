import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { BoardPublic, LayoutItem } from '../../types'
import './BoardView.scss'

const API = 'http://localhost:8000'

interface Comment {
  id: number
  text: string
  author: string
  author_type: 'user' | 'creator'
  created_at: string
}

function BoardView() {
  const { frameId } = useParams<{ frameId: string }>()
  const navigate = useNavigate()
  const [board, setBoard] = useState<BoardPublic | null>(null)
  const [items, setItems] = useState<LayoutItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')

  // likes
  const [likesCount, setLikesCount] = useState(0)
  const [liked, setLiked] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)

  // comments
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)

  const token = localStorage.getItem('authToken')
  const role = localStorage.getItem('userRole')
  const currentUsername = localStorage.getItem('username')
  const canInteract = role === 'user' || role === 'creator'

  useEffect(() => {
    if (!frameId) return
    fetch(`${API}/api/creators/boards/${frameId}`)
      .then(r => { if (!r.ok) throw new Error('Мудборд не найден'); return r.json() })
      .then((data: BoardPublic) => {
        setBoard(data)
        try {
          const layout = JSON.parse(data.layout)
          setItems(layout.items || [])
        } catch (err) {
          console.error('Ошибка парсинга layout:', err)
        }
        setLoading(false)
      })
      .catch((err: Error) => { setError(err.message); setLoading(false) })

    // load likes count
    fetch(`${API}/api/users/frames/${frameId}/likes`)
      .then(r => r.json())
      .then(d => setLikesCount(d.likes_count ?? 0))
      .catch(() => {})

    // load my like status
    if (token && canInteract) {
      fetch(`${API}/api/users/frames/${frameId}/my-like`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(d => setLiked(d.liked ?? false))
        .catch(() => {})
    }

    // load comments
    fetch(`${API}/api/users/frames/${frameId}/comments`)
      .then(r => r.json())
      .then((d: Comment[]) => setComments(d))
      .catch(() => {})
  }, [frameId])

  const handleLike = async () => {
    if (!token || !canInteract || likeLoading) return
    setLikeLoading(true)
    try {
      const res = await fetch(`${API}/api/users/frames/${frameId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setLiked(data.liked)
      setLikesCount(data.likes_count)
    } catch (e) {
      console.error(e)
    } finally {
      setLikeLoading(false)
    }
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !canInteract || !newComment.trim() || commentLoading) return
    setCommentLoading(true)
    try {
      const res = await fetch(`${API}/api/users/frames/${frameId}/comments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: newComment.trim() }),
      })
      if (!res.ok) throw new Error()
      const comment: Comment = await res.json()
      setComments(prev => [...prev, comment])
      setNewComment('')
    } catch (e) {
      console.error(e)
    } finally {
      setCommentLoading(false)
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    if (!token) return
    try {
      await fetch(`${API}/api/users/frames/${frameId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setComments(prev => prev.filter(c => c.id !== commentId))
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) return <div className="boardview-loading">загрузка...</div>
  if (error || !board) return (
    <div className="boardview-error">
      <p>{error || 'Не найдено'}</p>
      <button onClick={() => navigate(-1)}>← назад</button>
    </div>
  )

  const maxX = items.reduce((m, i) => Math.max(m, i.x + i.width), 800)
  const maxY = items.reduce((m, i) => Math.max(m, i.y + i.height), 600)
  const canvasW = maxX + 60
  const canvasH = maxY + 60

  return (
    <div className="boardview-page">
      <header className="boardview-header">
        <button className="boardview-back" onClick={() => navigate(-1)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          назад
        </button>
        <div className="boardview-meta">
          <h1 className="boardview-title">{board.title}</h1>
          {board.creator && <span className="boardview-author">@{board.creator.username}</span>}
        </div>
        {board.tags?.length > 0 && (
          <div className="boardview-tags">
            {board.tags.map(t => <span key={t.id} className="boardview-tag">{t.name}</span>)}
          </div>
        )}
      </header>

      <main className="boardview-main">
        <div className="boardview-canvas" style={{ width: canvasW, height: canvasH }}>
          {items.map(item => (
            <div key={item.id} className="boardview-item"
              style={{ left: item.x, top: item.y, width: item.width, height: item.height }}>
              <img src={item.url} alt="" />
            </div>
          ))}
        </div>
      </main>

      {/* ── social bar ──────────────────────────────────── */}
      <section className="boardview-social">

        {/* like button */}
        <div className="boardview-like-row">
          <button
            className={`boardview-like-btn${liked ? ' boardview-like-btn--active' : ''}`}
            onClick={handleLike}
            disabled={!canInteract || likeLoading}
            title={!canInteract ? 'Войдите чтобы лайкать' : ''}
          >
            {liked ? '♥' : '♡'}
            <span>{likesCount}</span>
          </button>
          {!canInteract && (
            <span className="boardview-social-hint">
              <button
                className="boardview-social-link"
                onClick={() => {
                  // dispatch custom event to open login modal from top-level LoginButton
                  window.dispatchEvent(new CustomEvent('open-login-modal'))
                }}
              >
                Войдите
              </button>
              , чтобы лайкать и комментировать
            </span>
          )}
        </div>

        {/* comments */}
        <div className="boardview-comments">
          <h3 className="boardview-comments-title">
            Комментарии <span className="boardview-comments-count">{comments.length}</span>
          </h3>

          {comments.length === 0 && (
            <p className="boardview-no-comments">Комментариев пока нет</p>
          )}

          <div className="boardview-comments-list">
            {comments.map(c => (
              <div key={c.id} className="boardview-comment">
                <div className="boardview-comment-avatar">
                  {c.author.charAt(0).toUpperCase()}
                </div>
                <div className="boardview-comment-body">
                  <div className="boardview-comment-header">
                    <span className="boardview-comment-author">@{c.author}</span>
                    {c.author_type === 'creator' && (
                      <span className="boardview-comment-badge">креатор</span>
                    )}
                    <span className="boardview-comment-date">
                      {new Date(c.created_at).toLocaleDateString('ru-RU', {
                        day: 'numeric', month: 'short'
                      })}
                    </span>
                  </div>
                  <p className="boardview-comment-text">{c.text}</p>
                </div>
                {/* delete only own comments */}
                {canInteract && c.author === currentUsername && (
                  <button
                    className="boardview-comment-delete"
                    onClick={() => handleDeleteComment(c.id)}
                    title="Удалить"
                  >✕</button>
                )}
              </div>
            ))}
          </div>

          {canInteract && (
            <form className="boardview-comment-form" onSubmit={handleComment}>
              <input
                className="boardview-comment-input"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Напишите комментарий..."
                maxLength={500}
              />
              <button
                type="submit"
                className="boardview-comment-submit"
                disabled={!newComment.trim() || commentLoading}
              >
                {commentLoading ? '...' : '→'}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}

export default BoardView