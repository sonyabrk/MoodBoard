import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './BoardView.scss';

const API = 'http://localhost:8000';

function BoardView() {
  const { frameId } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API}/api/creators/boards/${frameId}`)
      .then(r => { if (!r.ok) throw new Error('Мудборд не найден'); return r.json(); })
      .then(data => {
        setBoard(data);
        try {
          const layout = JSON.parse(data.layout);
          setItems(layout.items || []);
        } catch (err){
            console.error('Ошибка парсинга layout:', err);
        }
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [frameId]);

  if (loading) return <div className="boardview-loading">загрузка...</div>;
  if (error) return (
    <div className="boardview-error">
      <p>{error}</p>
      <button onClick={() => navigate(-1)}>← назад</button>
    </div>
  );

  // Вычисляем размеры холста под контент
  const maxX = items.reduce((m, i) => Math.max(m, i.x + i.width), 800);
  const maxY = items.reduce((m, i) => Math.max(m, i.y + i.height), 600);
  const canvasW = maxX + 60;
  const canvasH = maxY + 60;

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
          {board.creator && (
            <span className="boardview-author">@{board.creator.username}</span>
          )}
        </div>
        {board.tags?.length > 0 && (
          <div className="boardview-tags">
            {board.tags.map(t => (
              <span key={t.id} className="boardview-tag">{t.name}</span>
            ))}
          </div>
        )}
      </header>

      <main className="boardview-main">
        <div
          className="boardview-canvas"
          style={{ width: canvasW, height: canvasH }}
        >
          {items.map(item => (
            <div
              key={item.id}
              className="boardview-item"
              style={{ left: item.x, top: item.y, width: item.width, height: item.height }}
            >
              <img src={item.url} alt="" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default BoardView;