import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import BoardPreview from '../../components/BoardPreview/BoardPreview'
import type { FramePublic, Tag, Creator } from '../../types'
import './Search.scss'

const API = 'http://localhost:8000'

type Mode = 'list' | 'spectrum'

interface MoodFrame {
  id: number
  title: string
  mood_x: number
  mood_y: number
  has_mood: boolean
  tags: { id: number; name: string }[]
  layout: string
}

// ── Spectrum Map ──────────────────────────────────────────────────────────────

const MAP_SIZE = 480 // px, square

interface TooltipState {
  frame: MoodFrame
  px: number
  py: number
}

function SpectrumMap({
  frames,
  onNavigate,
}: {
  frames: MoodFrame[]
  onNavigate: (id: number) => void
}) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const [selRect, setSelRect] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null)
  const [filtered, setFiltered] = useState<Set<number>>(new Set())
  const dragStart = useRef<{ x: number; y: number } | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  const toPx = (mx: number, my: number) => ({
    px: mx * MAP_SIZE,
    py: (1 - my) * MAP_SIZE,
  })

  const fromPx = (px: number, py: number) => ({
    mx: px / MAP_SIZE,
    my: 1 - py / MAP_SIZE,
  })

  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

  const relPos = (e: MouseEvent | React.MouseEvent) => {
    if (!mapRef.current) return { px: 0, py: 0 }
    const rect = mapRef.current.getBoundingClientRect()
    return {
      px: clamp(e.clientX - rect.left, 0, MAP_SIZE),
      py: clamp(e.clientY - rect.top, 0, MAP_SIZE),
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.smap-dot')) return
    isDragging.current = false
    const { px, py } = relPos(e)
    dragStart.current = { x: px, y: py }
    setSelRect(null)
    setFiltered(new Set())
    setTooltip(null)
  }

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!dragStart.current) return
      isDragging.current = true
      const { px, py } = relPos(e)
      const rect = {
        x1: Math.min(dragStart.current.x, px),
        y1: Math.min(dragStart.current.y, py),
        x2: Math.max(dragStart.current.x, px),
        y2: Math.max(dragStart.current.y, py),
      }
      setSelRect(rect)

      // filter points inside rect
      const { mx: x1, my: y2 } = fromPx(rect.x1, rect.y1)
      const { mx: x2, my: y1 } = fromPx(rect.x2, rect.y2)
      const inside = new Set(
        frames.filter(f => f.mood_x >= x1 && f.mood_x <= x2 && f.mood_y >= y1 && f.mood_y <= y2).map(f => f.id)
      )
      setFiltered(inside)
    }
    const handleUp = () => {
      if (!isDragging.current) {
        setSelRect(null)
        setFiltered(new Set())
      }
      dragStart.current = null
    }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [frames])

  const isFiltering = filtered.size > 0

  return (
    <div className="smap-outer">
      <div className="smap-y-label smap-y-top">светлый</div>
      <div className="smap-row">
        <div className="smap-x-label smap-x-left">минимализм</div>

        <div
          ref={mapRef}
          className="smap-canvas"
          style={{ width: MAP_SIZE, height: MAP_SIZE }}
          onMouseDown={handleMouseDown}
        >
          {/* background gradient */}
          <div className="smap-bg" />
          <div className="smap-bg-x" />

          {/* grid */}
          <div className="smap-grid-h" />
          <div className="smap-grid-v" />

          {/* axis labels inside */}
          <span className="smap-corner smap-tl">↖ минимально светлый</span>
          <span className="smap-corner smap-tr">↗ максимально светлый</span>
          <span className="smap-corner smap-bl">↙ минимально тёмный</span>
          <span className="smap-corner smap-br">↘ максимально тёмный</span>

          {/* selection rect */}
          {selRect && (
            <div
              className="smap-sel-rect"
              style={{
                left: selRect.x1,
                top: selRect.y1,
                width: selRect.x2 - selRect.x1,
                height: selRect.y2 - selRect.y1,
              }}
            />
          )}

          {/* dots */}
          {frames.map(f => {
            const { px, py } = toPx(f.mood_x, f.mood_y)
            const dimmed = isFiltering && !filtered.has(f.id)
            return (
              <div
                key={f.id}
                className={`smap-dot${dimmed ? ' smap-dot--dim' : ''}${!f.has_mood ? ' smap-dot--center' : ''}`}
                style={{ left: px, top: py }}
                onMouseEnter={() => setTooltip({ frame: f, px, py })}
                onMouseLeave={() => setTooltip(null)}
                onClick={() => onNavigate(f.id)}
                title={f.title}
              />
            )
          })}

          {/* tooltip */}
          {tooltip && (
            <div
              className="smap-tooltip"
              style={{
                left: tooltip.px > MAP_SIZE - 200 ? tooltip.px - 180 : tooltip.px + 16,
                top: tooltip.py > MAP_SIZE - 120 ? tooltip.py - 110 : tooltip.py - 8,
              }}
            >
              <div className="smap-tooltip-preview">
                <BoardPreview layout={tooltip.frame.layout} />
              </div>
              <div className="smap-tooltip-title">{tooltip.frame.title}</div>
              {tooltip.frame.tags.length > 0 && (
                <div className="smap-tooltip-tags">
                  {tooltip.frame.tags.slice(0, 3).map(t => (
                    <span key={t.id} className="smap-tooltip-tag">{t.name}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="smap-x-label smap-x-right">максимализм</div>
      </div>
      <div className="smap-y-label smap-y-bottom">тёмный</div>

      <p className="smap-hint">
        наведите на точку — превью · кликните — открыть · выделите область — отфильтровать
      </p>

      {isFiltering && (
        <p className="smap-filter-info">
          выбрано мудбордов: {filtered.size}
          <button className="smap-filter-clear" onClick={() => { setSelRect(null); setFiltered(new Set()) }}>сбросить</button>
        </p>
      )}
    </div>
  )
}

// ── Main Search component ─────────────────────────────────────────────────────

function Search() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [mode, setMode] = useState<Mode>('list')
  const [query, setQuery] = useState<string>(searchParams.get('q') ?? '')
  const [activeTag, setActiveTag] = useState<string>(searchParams.get('tag') ?? '')
  const [frames, setFrames] = useState<FramePublic[]>([])
  const [creators, setCreators] = useState<Creator[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [searched, setSearched] = useState<boolean>(false)

  // spectrum mode
  const [moodFrames, setMoodFrames] = useState<MoodFrame[]>([])
  const [moodLoading, setMoodLoading] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/tags`)
      .then(r => r.ok ? r.json() : [])
      .then((data: Tag[]) => setTags(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  const doSearch = useCallback((q: string, tag: string): void => {
    setLoading(true)
    setSearched(true)

    const frameParams = new URLSearchParams()
    if (q) frameParams.set('search', q)
    if (tag) frameParams.set('tag', tag)

    const fetchFrames = fetch(`${API}/api/frames?${frameParams}`)
      .then(r => r.ok ? r.json() : [])
      .then((data: FramePublic[]) => setFrames(Array.isArray(data) ? data : []))

    const fetchCreators = q
      ? fetch(`${API}/api/profiles/search?q=${encodeURIComponent(q)}`)
          .then(r => r.ok ? r.json() : [])
          .then((data: Creator[]) => setCreators(Array.isArray(data) ? data : []))
      : Promise.resolve(setCreators([]))

    Promise.all([fetchFrames, fetchCreators])
      .catch(err => console.error('Ошибка поиска:', err))
      .finally(() => setLoading(false))
  }, [])

  const loadMoodSpectrum = useCallback((q: string, tag: string) => {
    setMoodLoading(true)
    const params = new URLSearchParams()
    if (q) params.set('search', q)
    if (tag) params.set('tag', tag)
    fetch(`${API}/api/mood-spectrum?${params}`)
      .then(r => r.ok ? r.json() : [])
      .then((data: MoodFrame[]) => setMoodFrames(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setMoodLoading(false))
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!query && !activeTag) {
        setFrames([])
        setCreators([])
        setSearched(false)
        if (mode === 'spectrum') loadMoodSpectrum('', '')
        return
      }
      if (mode === 'list') doSearch(query, activeTag)
      else loadMoodSpectrum(query, activeTag)

      const p: Record<string, string> = {}
      if (query) p.q = query
      if (activeTag) p.tag = activeTag
      setSearchParams(p, { replace: true })
    }, 300)
    return () => clearTimeout(timer)
  }, [query, activeTag, doSearch, setSearchParams, mode, loadMoodSpectrum])

  // load spectrum on mode switch
  useEffect(() => {
    if (mode === 'spectrum') loadMoodSpectrum(query, activeTag)
  }, [mode])

  const handleTagClick = (tagName: string): void => {
    setActiveTag(activeTag === tagName ? '' : tagName)
  }

  const handleClear = (): void => {
    setQuery('')
    setActiveTag('')
    setFrames([])
    setCreators([])
    setSearched(false)
    setSearchParams({}, { replace: true })
  }

  const hasResults = frames.length > 0 || creators.length > 0

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

        {/* mode toggle */}
        <div className="search-mode-toggle">
          <button
            className={`search-mode-btn${mode === 'list' ? ' search-mode-btn--active' : ''}`}
            onClick={() => setMode('list')}
            title="Список"
          >
            <svg viewBox="0 0 20 20" fill="currentColor">
              <rect x="2" y="3" width="16" height="2.5" rx="1.25"/>
              <rect x="2" y="8.75" width="16" height="2.5" rx="1.25"/>
              <rect x="2" y="14.5" width="16" height="2.5" rx="1.25"/>
            </svg>
          </button>
          <button
            className={`search-mode-btn${mode === 'spectrum' ? ' search-mode-btn--active' : ''}`}
            onClick={() => setMode('spectrum')}
            title="Mood-спектр"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="2" y="2" width="16" height="16" rx="3"/>
              <line x1="10" y1="2" x2="10" y2="18" strokeOpacity=".35"/>
              <line x1="2" y1="10" x2="18" y2="10" strokeOpacity=".35"/>
              <circle cx="6" cy="7" r="1.5" fill="currentColor" stroke="none"/>
              <circle cx="14" cy="5" r="1.5" fill="currentColor" stroke="none"/>
              <circle cx="8" cy="14" r="1.5" fill="currentColor" stroke="none"/>
              <circle cx="15" cy="13" r="1.5" fill="currentColor" stroke="none"/>
            </svg>
          </button>
        </div>
      </header>

      {tags.length > 0 && (
        <div className="search-tags">
          <button className={`search-tag ${activeTag === '' ? 'active' : ''}`} onClick={() => handleTagClick('')}>
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

      {/* ── LIST MODE ── */}
      {mode === 'list' && (
        <main className="search-results">
          {loading && <div className="search-status">поиск...</div>}
          {!loading && !searched && <div className="search-status">введите запрос или выберите тег</div>}
          {!loading && searched && !hasResults && <div className="search-status">ничего не найдено</div>}

          {!loading && hasResults && (
            <>
              {creators.length > 0 && (
                <div className="search-section">
                  <h3 className="search-section-title">креаторы</h3>
                  <div className="search-creators">
                    {creators.map(c => (
                      <div key={c.id} className="search-creator-card" onClick={() => navigate(`/profile/${c.username}`)}>
                        <div className="search-creator-avatar">{c.first_name?.charAt(0).toUpperCase()}</div>
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

              {frames.length > 0 && (
                <div className="search-section">
                  {creators.length > 0 && <h3 className="search-section-title">мудборды</h3>}
                  <div className="search-count">
                    {frames.length} {frames.length === 1 ? 'мудборд' : frames.length < 5 ? 'мудборда' : 'мудбордов'}
                  </div>
                  <div className="search-grid">
                    {frames.map(frame => (
                      <div key={frame.id} className="search-card" onClick={() => navigate(`/boards/${frame.id}`)}>
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
      )}

      {/* ── SPECTRUM MODE ── */}
      {mode === 'spectrum' && (
        <main className="search-results search-spectrum-main">
          {moodLoading && <div className="search-status">загрузка спектра...</div>}
          {!moodLoading && moodFrames.length === 0 && (
            <div className="search-status">нет мудбордов для отображения</div>
          )}
          {!moodLoading && moodFrames.length > 0 && (
            <div className="search-spectrum-wrap">
              <div className="search-spectrum-header">
                <span className="search-spectrum-count">
                  {moodFrames.length} мудбордов на карте
                  {moodFrames.filter(f => !f.has_mood).length > 0 && (
                    <span className="search-spectrum-unplaced">
                      · {moodFrames.filter(f => !f.has_mood).length} без координат (в центре)
                    </span>
                  )}
                </span>
              </div>
              <SpectrumMap frames={moodFrames} onNavigate={id => navigate(`/boards/${id}`)} />
            </div>
          )}
        </main>
      )}
    </div>
  )
}

export default Search