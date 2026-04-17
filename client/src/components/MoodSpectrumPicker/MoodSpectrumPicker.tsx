import { useRef, useCallback, useEffect, useState } from 'react'
import './MoodSpectrumPicker.scss'

interface Props {
  moodX: number | null   // 0=minimalism, 1=maximalism
  moodY: number | null   // 0=dark, 1=light
  onChange: (x: number, y: number) => void
  onClear?: () => void
}

const SIZE = 200 // px

function clamp(v: number) { return Math.max(0, Math.min(1, v)) }

function MoodSpectrumPicker({ moodX, moodY, onChange, onClear }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const [localX, setLocalX] = useState<number | null>(moodX)
  const [localY, setLocalY] = useState<number | null>(moodY)

  useEffect(() => { setLocalX(moodX); setLocalY(moodY) }, [moodX, moodY])

  const posFromEvent = useCallback((e: MouseEvent | TouchEvent) => {
    if (!canvasRef.current) return null
    const rect = canvasRef.current.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const x = clamp((clientX - rect.left) / rect.width)
    const y = clamp(1 - (clientY - rect.top) / rect.height) // invert Y: top=light(1), bottom=dark(0)
    return { x, y }
  }, [])

  const handleDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    dragging.current = true
    const pos = posFromEvent(e.nativeEvent as MouseEvent)
    if (!pos) return
    setLocalX(pos.x)
    setLocalY(pos.y)
    onChange(pos.x, pos.y)
  }, [posFromEvent, onChange])

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging.current) return
      const pos = posFromEvent(e)
      if (!pos) return
      setLocalX(pos.x)
      setLocalY(pos.y)
      onChange(pos.x, pos.y)
    }
    const handleUp = () => { dragging.current = false }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    window.addEventListener('touchmove', handleMove, { passive: false })
    window.addEventListener('touchend', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('touchend', handleUp)
    }
  }, [posFromEvent, onChange])

  const hasValue = localX !== null && localY !== null

  const dotLeft = hasValue ? (localX! * SIZE) : SIZE / 2
  const dotTop  = hasValue ? ((1 - localY!) * SIZE) : SIZE / 2

  return (
    <div className="msp-wrap">
      <div className="msp-label-row">
        <span className="msp-label">mood-спектр</span>
        {hasValue && onClear && (
          <button className="msp-clear" onClick={onClear} type="button">сбросить</button>
        )}
      </div>

      <div className="msp-container">
        <div className="msp-axis-y-top">светлый</div>

        <div className="msp-inner">
          <div className="msp-axis-x-left">минимализм</div>

          <div
            ref={canvasRef}
            className="msp-canvas"
            onMouseDown={handleDown}
            onTouchStart={handleDown}
          >
            
            <div className="msp-bg" />

            <div className="msp-grid-h" />
            <div className="msp-grid-v" />

            {hasValue && (
              <div
                className="msp-dot"
                style={{ left: dotLeft, top: dotTop }}
              />
            )}
            {!hasValue && (
              <div className="msp-placeholder">нажмите чтобы выбрать</div>
            )}
          </div>

          <div className="msp-axis-x-right">максимализм</div>
        </div>

        <div className="msp-axis-y-bottom">тёмный</div>
      </div>

      {hasValue && (
        <div className="msp-readout">
          <span>минимализм ↔ максимализм: <b>{Math.round(localX! * 100)}%</b></span>
          <span>тёмный ↔ светлый: <b>{Math.round(localY! * 100)}%</b></span>
        </div>
      )}
    </div>
  )
}

export default MoodSpectrumPicker