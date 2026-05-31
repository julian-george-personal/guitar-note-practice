import { useState, useLayoutEffect, useCallback, useEffect, useRef } from 'react'
import './ConfigSection.css'
import { createPortal } from 'react-dom'
import { useIsMobile } from '../../hooks/useIsMobile'

const Chevron = () => (
  <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="2,4 7,10 12,4" />
  </svg>
)

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)


// Persists across remounts so switching exercise mode doesn't close the sheet.
let persistedOpen = false

export interface ExerciseModeProps {
  exercise?: string
  onExerciseChange?: (v: string) => void
}

export const EXERCISE_OPTIONS = [
  { value: 'note', label: 'Note' },
  { value: 'string', label: 'String' },
  { value: 'custom', label: 'Custom (AI)' },
] as const

interface ConfigSectionProps extends ExerciseModeProps {
  children: React.ReactNode
}

export default function ConfigSection({ children, exercise, onExerciseChange }: ConfigSectionProps) {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)
  const [open, setOpenState] = useState(persistedOpen)
  const setOpen = useCallback((v: boolean) => { persistedOpen = v; setOpenState(v) }, [])
  const skipAnimation = useRef(persistedOpen)
  useEffect(() => { skipAnimation.current = false }, [])
  const isMobile = useIsMobile()

  useLayoutEffect(() => { setPortalTarget(document.getElementById('config-portal')) }, [])

  if (!portalTarget) return null

  if (isMobile) {
    const pill = createPortal(
      <button className="mobile-pill" onClick={() => setOpen(true)}>
        <EditIcon /> Edit Exercise
      </button>,
      document.body
    )

    const sheet = open && createPortal(
      <>
        <div className="config-overlay" onClick={() => setOpen(false)} />
        <div className={`config-sheet${skipAnimation.current ? ' no-animate' : ''}`}>
          <div className="config-sheet-handle" />
          <button className="config-sheet-close" onClick={() => setOpen(false)}>✕</button>
          {exercise != null && onExerciseChange && (
            <div className="input-group exercise-mode-group">
              <label className="config-sheet-label">Exercise Mode</label>
              <select value={exercise} onChange={e => onExerciseChange(e.target.value)}>
                {EXERCISE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          )}
          <div className="config-content">{children}</div>
        </div>
      </>,
      document.body
    )

    return <>{pill}{sheet}</>
  }

  return createPortal(
    <details className="config">
      <summary>Config <Chevron /></summary>
      <div className="config-content">{children}</div>
    </details>,
    portalTarget
  )
}
