import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './Search.scss';

const API = 'http://localhost:8000';

function Search() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [activeTag, setActiveTag] = useState(searchParams.get('tag') || '');
    const [frames, setFrames] = useState([]);
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    useEffect(() => {
        fetch(`${API}/api/tags`)
            .then(r => r.ok ? r.json() : [])
            .then(data => setTags(Array.isArray(data) ? data : []))
            .catch(() => {});
    }, []);

    const doSearch = useCallback((q, tag) => {
        setLoading(true);
        setSearched(true);
        const params = new URLSearchParams();
        if (q) params.set('search', q);
        if (tag) params.set('tag', tag);

        fetch(`${API}/api/frames?${params}`)
            .then(r => r.ok ? r.json() : [])
            .then(data => {
            setFrames(Array.isArray(data) ? data : []);
            setLoading(false);
            })
            .catch(() => { setFrames([]); setLoading(false); });
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!query && !activeTag) {
                setFrames([]);
                setSearched(false);
                return;
            }
            doSearch(query, activeTag);
            const p = {};
            if (query) p.q = query;
            if (activeTag) p.tag = activeTag;
            setSearchParams(p, { replace: true });
        }, 300);
        return () => clearTimeout(timer);
    }, [query, activeTag, doSearch, setSearchParams]);

    const handleTagClick = (tagName) => {
        const next = activeTag === tagName ? '' : tagName;
        setActiveTag(next);
    };

    const handleClear = () => {
        setQuery('');
        setActiveTag('');
        setFrames([]);
        setSearched(false);
        setSearchParams({}, { replace: true });
    };

    const getThumb = (frame) => {
        try {
            const layout = JSON.parse(frame.layout);
            const img = layout?.items?.find(i => i.type === 'image');
            return img?.url || null;
        } catch { return null; }
    };

  return (
    <div className="search-page">

      {/* Хедер */}
      <header className="search-header">
        <button className="search-back-btn" onClick={() => navigate('/')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          плэйн
        </button>

        <div className="search-input-wrap">
          <svg className="search-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="найти мудборд..."
            className="search-input"
          />
          {(query || activeTag) && (
            <button className="search-clear-btn" onClick={handleClear}>✕</button>
          )}
        </div>
      </header>

      {/* Теги */}
      {tags.length > 0 && (
        <div className="search-tags">
          <button
            className={`search-tag ${activeTag === '' ? 'active' : ''}`}
            onClick={() => handleTagClick('')}
          >
            все
          </button>
          {tags.map(tag => (
            <button
              key={tag.id}
              className={`search-tag ${activeTag === tag.name ? 'active' : ''}`}
              onClick={() => handleTagClick(tag.name)}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}

      {/* Результаты */}
      <main className="search-results">
        {loading && (
          <div className="search-status">поиск...</div>
        )}

        {!loading && !searched && (
          <div className="search-status">введите запрос или выберите тег</div>
        )}

        {!loading && searched && frames.length === 0 && (
          <div className="search-status">ничего не найдено</div>
        )}

        {!loading && frames.length > 0 && (
          <>
            <div className="search-count">{frames.length} {frames.length === 1 ? 'мудборд' : frames.length < 5 ? 'мудборда' : 'мудбордов'}</div>
            <div className="search-grid">
              {frames.map(frame => (
                <div key={frame.id} className="search-card">
                  <div className="search-card-thumb">
                    {getThumb(frame)
                      ? <img src={getThumb(frame)} alt={frame.title} />
                      : <div className="search-card-placeholder" />
                    }
                  </div>
                  <div className="search-card-info">
                    <span className="search-card-title">{frame.title}</span>
                    {frame.tags?.length > 0 && (
                      <div className="search-card-tags">
                        {frame.tags.slice(0, 3).map(t => (
                          <span key={t.id} className="search-card-tag">{t.name}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default Search;