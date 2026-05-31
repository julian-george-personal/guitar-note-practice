import { useState, useCallback, useRef, useEffect } from 'react'
import './TuningInput.css'
import { Note } from 'tonal'
import { toSharp } from '../../lib/audio'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useClickIntent } from '../../hooks/useClickIntent'

interface StringChipProps {
  openNote: string
  isActive: boolean
  canToggle: boolean
  isEditing: boolean
  editDraft: string
  onToggle: () => void
  onEdit: () => void
  onDraftChange: (v: string) => void
  onCommit: () => void
  onCancelEdit: () => void
}

function StringChip({ openNote, isActive, canToggle, isEditing, editDraft, onToggle, onEdit, onDraftChange, onCommit, onCancelEdit }: StringChipProps) {
  const isMobile = useIsMobile()

  const clickIntent = useClickIntent({ onClick: onToggle, onDoubleClick: onEdit })

  const longPressTimer = useRef<number | null>(null)
  const longPressFired = useRef(false)
  const lastTapTime = useRef(0)

  useEffect(() => () => { if (longPressTimer.current) clearTimeout(longPressTimer.current) }, [])

  const handleTouchStart = () => {
    longPressFired.current = false
    longPressTimer.current = window.setTimeout(() => {
      longPressFired.current = true
      longPressTimer.current = null
      onEdit()
    }, 500)
  }

  const cancelLongPress = () => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null }
    if (longPressFired.current) { e.preventDefault(); longPressFired.current = false; return }
    const now = Date.now()
    if (now - lastTapTime.current < 300) {
      e.preventDefault()
      lastTapTime.current = 0
      onEdit()
    } else {
      lastTapTime.current = now
    }
  }

  const touchHandlers = isMobile ? {
    onTouchStart: handleTouchStart,
    onTouchMove: cancelLongPress,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: cancelLongPress,
  } : {}

  return (
    <div
      className={`string-chip${isActive ? ' active' : ''}${!canToggle ? ' no-toggle' : ''}`}
      {...clickIntent}
      {...touchHandlers}
    >
      {isEditing ? (
        <input
          className="string-chip-input"
          value={editDraft}
          autoFocus
          onChange={e => onDraftChange(e.target.value)}
          onClick={e => e.stopPropagation()}
          onBlur={onCommit}
          onKeyDown={e => {
            if (e.key === 'Enter') e.currentTarget.blur()
            if (e.key === 'Escape') onCancelEdit()
          }}
        />
      ) : (
        <span
          className="string-chip-label"
          onClick={!isMobile ? (e => { e.stopPropagation(); onEdit() }) : undefined}
        >
          {openNote}
        </span>
      )}
    </div>
  )
}

interface TuningInputProps {
  tuningNotes: string[]
  onChange: (notes: string[]) => void
  enabledStrings?: number[]
  onToggle?: (str: number) => void
}

export default function TuningInput({ tuningNotes, onChange, enabledStrings, onToggle }: TuningInputProps) {
  const [editState, setEditState] = useState<{ index: number; draft: string } | null>(null)

  const commitEdit = useCallback((index: number) => {
    setEditState(prev => {
      if (!prev || prev.index !== index) return prev
      const n = Note.get(prev.draft.trim())
      if (!n.empty) {
        const next = [...tuningNotes]
        next[index] = toSharp(n.pc)
        onChange(next)
      }
      return null
    })
  }, [tuningNotes, onChange])

  return (
    <div className="string-chips">
      {Array.from({ length: tuningNotes.length }, (_, i) => {
        const str = tuningNotes.length - i
        const noteIndex = tuningNotes.length - str
        const openNote = tuningNotes[noteIndex]

        return (
          <StringChip
            key={str}
            openNote={openNote}
            isActive={!enabledStrings || enabledStrings.includes(str)}
            canToggle={!!onToggle}
            isEditing={editState?.index === noteIndex}
            editDraft={editState?.index === noteIndex ? editState.draft : ''}
            onToggle={() => onToggle?.(str)}
            onEdit={() => setEditState({ index: noteIndex, draft: openNote })}
            onDraftChange={v => setEditState({ index: noteIndex, draft: v })}
            onCommit={() => commitEdit(noteIndex)}
            onCancelEdit={() => setEditState(null)}
          />
        )
      })}
    </div>
  )
}
