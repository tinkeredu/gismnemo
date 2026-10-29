import { useEffect, useLayoutEffect, useState, type CSSProperties } from 'react'
import { GUIDE_STEPS } from './guideSteps'

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

const PAD = 6
const CARD_W = 380

export function GuideOverlay({ index, onIndex, onClose }: { index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const step = GUIDE_STEPS[index]
  const [rect, setRect] = useState<Rect | null>(null)

  useLayoutEffect(() => {
    const el = step.target ? document.querySelector<HTMLElement>(`[data-guide="${step.target}"]`) : null
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    let frame = 0
    const measure = () => {
      const r = el?.getBoundingClientRect()
      setRect((prev) => {
        if (!r) return null
        if (prev && prev.top === r.top && prev.left === r.left && prev.width === r.width && prev.height === r.height) return prev
        return { top: r.top, left: r.left, width: r.width, height: r.height }
      })
      frame = requestAnimationFrame(measure)
    }
    measure()
    return () => cancelAnimationFrame(frame)
  }, [step])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight' && index < GUIDE_STEPS.length - 1) onIndex(index + 1)
      else if (e.key === 'ArrowLeft' && index > 0) onIndex(index - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, onIndex, onClose])

  const vw = window.innerWidth
  const vh = window.innerHeight
  const cardStyle: CSSProperties = { width: Math.min(CARD_W, vw - 16) }
  if (rect) {
    const w = cardStyle.width as number
    const spaceRight = vw - (rect.left + rect.width)
    if (spaceRight >= w + 24) {
      cardStyle.left = rect.left + rect.width + 16
      cardStyle.top = Math.max(8, Math.min(rect.top, vh - 320))
    } else if (rect.left >= w + 24) {
      cardStyle.left = rect.left - w - 16
      cardStyle.top = Math.max(8, Math.min(rect.top, vh - 320))
    } else {
      cardStyle.left = Math.max(8, Math.min(rect.left, vw - w - 8))
      const below = rect.top + rect.height + 16
      if (below + 260 < vh) cardStyle.top = below
      else cardStyle.bottom = Math.max(8, vh - rect.top + 16)
    }
  } else {
    cardStyle.left = (vw - (cardStyle.width as number)) / 2
    cardStyle.top = Math.max(8, vh / 2 - 160)
  }

  const last = index === GUIDE_STEPS.length - 1
  return (
    <div className="fixed inset-0 z-50" aria-live="polite">
      {rect ? (
        <div
          className="pointer-events-none fixed rounded border-2 border-yellow-400 transition-all duration-200"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + 2 * PAD,
            height: rect.height + 2 * PAD,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-black/45" />
      )}
      <div role="dialog" aria-label={`Guide: ${step.title}`} className="fixed guide-card p-3" style={cardStyle}>
        <div className="mb-1 flex items-baseline gap-2">
          <h2 className="flex-1 font-bold">{step.title}</h2>
          <span className="text-xs text-muted">
            {index + 1} / {GUIDE_STEPS.length}
          </span>
        </div>
        <div className="flex flex-col gap-2 text-[13px]">{step.body}</div>
        <div className="mt-3 flex gap-1">
          <button type="button" className="btn" onClick={onClose}>
            Beenden
          </button>
          <span className="flex-1" />
          <button type="button" className="btn" onClick={() => onIndex(index - 1)} disabled={index === 0}>
            Zurück
          </button>
          <button type="button" className="btn font-bold" onClick={() => (last ? onClose() : onIndex(index + 1))} autoFocus>
            {last ? 'Fertig' : 'Weiter'}
          </button>
        </div>
      </div>
    </div>
  )
}
