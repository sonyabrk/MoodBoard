import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BoardPreview from '../components/BoardPreview/BoardPreview';
import './Search.scss';

const API = 'http://localhost:8000';

function Search() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [activeTag, setActiveTag] = useState(searchParams.get('tag') || '');
  const [frames, setFrames] = useState([]);
  const [creators, setCreators] = useState([]);
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

    const frameParams = new URLSearchParams();
    if (q) frameParams.set('search', q);
    if (tag) frameParams.set('tag', tag);

    const fetchFrames = fetch(`${API}/api/frames?${frameParams}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setFrames(Array.isArray(data) ? data : []));

    const fetchCreators = q
      ? fetch(`${API}/api/profiles/search?q=${encodeURIComponent(q)}`)
          .then(r => r.ok ? r.json() : [])
          .then(data => setCreators(Array.isArray(data) ? data : []))
      : Promise.resolve(setCreators([]));

    Promise.all([fetchFrames, fetchCreators])
      .catch(err => console.error('Ошибка поиска:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!query && !activeTag) {
        setFrames([]);
        setCreators([]);
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
    setActiveTag(activeTag === tagName ? '' : tagName);
  };

  const handleClear = () => {
    setQuery('');
    setActiveTag('');
    setFrames([]);
    setCreators([]);
    setSearched(false);
    setSearchParams({}, { replace: true });
  };

  const hasResults = frames.length > 0 || creators.length > 0;

  return (
    <div className="search-page">
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
            placeholder="найти мудборд, тег или креатора..."
            className="search-input"
          />
          {(query || activeTag) && (
            <button className="search-clear-btn" onClick={handleClear}>✕</button>
          )}
        </div>
      </header>

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

      <main className="search-results">
        {loading && <div className="search-status">поиск...</div>}

        {!loading && !searched && (
          <div className="search-status">введите запрос или выберите тег</div>
        )}

        {!loading && searched && !hasResults && (
          <div className="search-status">ничего не найдено</div>
        )}

        {!loading && hasResults && (
          <>
            {/* Креаторы */}
            {creators.length > 0 && (
              <div className="search-section">
                <h3 className="search-section-title">креаторы</h3>
                <div className="search-creators">
                  {creators.map(c => (
                    <div
                      key={c.id}
                      className="search-creator-card"
                      onClick={() => navigate(`/profile/${c.username}`)}
                    >
                      <div className="search-creator-avatar">
                        {c.first_name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="search-creator-info">
                        <span className="search-creator-name">{c.first_name} {c.last_name}</span>
                        <span className="search-creator-username">@{c.username}</span>
                      </div>
                      <span className="search-creator-count">{c.frames_count} досок</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Мудборды */}
            {frames.length > 0 && (
              <div className="search-section">
                {creators.length > 0 && <h3 className="search-section-title">мудборды</h3>}
                <div className="search-count">{frames.length} {frames.length === 1 ? 'мудборд' : frames.length < 5 ? 'мудборда' : 'мудбордов'}</div>
                <div className="search-grid">
                  {frames.map(frame => (
                    <div
                      key={frame.id}
                      className="search-card"
                      onClick={() => navigate(`/boards/${frame.id}`)}
                    >
                      <div className="search-card-thumb">
                        <BoardPreview layout={frame.layout} />
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
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default Search;