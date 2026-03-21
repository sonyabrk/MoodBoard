import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './MoodboardEditor.scss';

const API = 'http://localhost:8000';
const CANVAS_W = 1200;
const CANVAS_H = 800;

function MoodboardEditor() {
  const { frameId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');
  const canvasRef = useRef(null);

  const [title, setTitle] = useState('Новый мудборд');
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tags, setTags] = useState('');

  const dragState = useRef(null);
  const resizeState = useRef(null);

  useEffect(() => {
    if (!frameId) return;
    fetch(`${API}/api/creators/me/frames`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(frames => {
        const frame = frames.find(f => f.id === parseInt(frameId));
        if (frame) {
          setTitle(frame.title);
          try {
            const layout = JSON.parse(frame.layout);
            setItems(layout.items || []);
          } catch (err) {
            console.error('Ошибка парсинга layout:', err);
          }
        }
      });
  }, [frameId, token]);

    const onItemMouseDown = useCallback((e, id, item) => {
        if (e.target.classList.contains('resize-handle')) return;
        e.preventDefault();
        e.stopPropagation();
        setSelected(id);
        dragState.current = {
            id,
            startX: e.clientX,
            startY: e.clientY,
            origX: item.x,
            origY: item.y,
        };
    }, []); 

    const onMouseMove = useCallback((e) => {
        if (dragState.current) {
            const drag = dragState.current; 
            if (!drag) return;              
            const dx = e.clientX - drag.startX;
            const dy = e.clientY - drag.startY;
            setItems(prev => prev.map(item =>
                item.id === drag.id
                ? { ...item, x: Math.max(0, drag.origX + dx), y: Math.max(0, drag.origY + dy) }
                : item
            ));
        }
        if (resizeState.current) {
            const resize = resizeState.current; 
            if (!resize) return;
            const dx = e.clientX - resize.startX;
            const dy = e.clientY - resize.startY;
            setItems(prev => prev.map(item =>
                item.id === resize.id
                ? {
                    ...item,
                    width: Math.max(80, resize.origW + dx),
                    height: Math.max(80, resize.origH + dy)
                    }
                : item
            ));
        }
    }, []);

  const onMouseUp = useCallback(() => {
    dragState.current = null;
    resizeState.current = null;
  }, []);

    const onResizeMouseDown = useCallback((e, id, item) => {
        e.preventDefault();
        e.stopPropagation();
        resizeState.current = {
            id,
            startX: e.clientX,
            startY: e.clientY,
            origW: item.width,
            origH: item.height,
        };
    }, []);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const r = await fetch(`${API}/api/creators/me/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        if (r.ok) {
          const data = await r.json();
          const newItem = {
            id: Date.now().toString() + Math.random(),
            url: data.url,
            x: 50 + items.length * 20,
            y: 50 + items.length * 20,
            width: 300,
            height: 400,
          };
          setItems(prev => [...prev, newItem]);
        }
      } catch (err) {
        console.error('Ошибка загрузки фото:', err);
        alert('Не удалось загрузить фото: ' + err.message);
      }
    }
    setUploading(false);
    e.target.value = '';
  };

  const deleteSelected = () => {
    if (!selected) return;
    setItems(prev => prev.filter(i => i.id !== selected));
    setSelected(null);
  };

  const bringForward = () => {
    if (!selected) return;
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === selected);
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  const sendBackward = () => {
    if (!selected) return;
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === selected);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]];
      return next;
    });
  };

  const handleSave = async (publish = false) => {
    setSaving(true);
    const layout = JSON.stringify({ items });
    const body = new FormData();
    body.append('title', title);
    body.append('layout', layout);
    body.append('is_published', publish.toString());
    if (tags.trim()) body.append('tag_names', JSON.stringify(tags.split(',').map(t => t.trim()).filter(Boolean)));

    try {
      let r;
      if (frameId) {
        r = await fetch(`${API}/api/creators/me/frames/${frameId}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body
        });
      } else {
        r = await fetch(`${API}/api/creators/me/frames`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body
        });
      }
      if (r.ok) {
        const data = await r.json();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        if (!frameId && data.id) {
          navigate(`/editor/${data.id}`, { replace: true });
        }
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="editor-page"
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      {/* ── Панель справа ── */}
      <aside className="editor-panel">
        <button className="editor-back-btn" onClick={() => navigate('/creator')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          мои доски
        </button>

        <div className="editor-section">
          <label className="editor-label">название</label>
          <input
            className="editor-input"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="название мудборда"
          />
        </div>

        <div className="editor-section">
          <label className="editor-label">теги (через запятую)</label>
          <input
            className="editor-input"
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="осень, минимализм..."
          />
        </div>

        <div className="editor-section">
          <label className="editor-label">фотографии</label>
          <label className="editor-upload-btn">
            {uploading ? 'загрузка...' : '+ добавить фото'}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              disabled={uploading}
            />
          </label>
          <p className="editor-hint">можно выбрать несколько сразу</p>
        </div>

        {selected && (
          <div className="editor-section">
            <label className="editor-label">выбранное фото</label>
            <div className="editor-item-controls">
              <button className="editor-ctrl-btn" onClick={bringForward}>вперёд</button>
              <button className="editor-ctrl-btn" onClick={sendBackward}>назад</button>
              <button className="editor-ctrl-btn danger" onClick={deleteSelected}>удалить</button>
            </div>
          </div>
        )}

        <div className="editor-actions">
          <button
            className="editor-save-btn draft"
            onClick={() => handleSave(false)}
            disabled={saving}
          >
            {saving ? 'сохраняю...' : saved ? '✓ сохранено' : 'сохранить черновик'}
          </button>
          <button
            className="editor-save-btn publish"
            onClick={() => handleSave(true)}
            disabled={saving}
          >
            опубликовать
          </button>
        </div>

        <p className="editor-hint center">
          перетаскивай фото мышью<br/>
          тяни за угол чтобы изменить размер
        </p>
      </aside>

      {/* Холст */}
      <div className="editor-canvas-wrap">
        <div
          ref={canvasRef}
          className="editor-canvas"
          style={{ width: CANVAS_W, height: CANVAS_H }}
          onClick={() => setSelected(null)}
        >
          {items.map(item => (
            <div
              key={item.id}
              className={`editor-item ${selected === item.id ? 'selected' : ''}`}
              style={{ left: item.x, top: item.y, width: item.width, height: item.height }}
              onMouseDown={e => onItemMouseDown(e, item.id, item)}
            >
              <img src={item.url} alt="" draggable={false} />
              <div
                className="resize-handle"
                onMouseDown={e => onResizeMouseDown(e, item.id, item)}
              />
            </div>
          ))}

          {items.length === 0 && (
            <div className="editor-canvas-empty">
              добавьте фото через панель справа
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MoodboardEditor;