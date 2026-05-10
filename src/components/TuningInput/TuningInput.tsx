import { useState, useCallback } from 'react'
import './TuningInput.css'
import { Note } from 'tonal'
import { toSharp } from '../../lib/audio'

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
        const isActive = !enabledStrings || enabledStrings.includes(str)
        const isEditing = editState?.index === noteIndex

        return (
          <div
            key={str}
            className={`string-chip${isActive ? ' active' : ''}${!onToggle ? ' no-toggle' : ''}`}
            onClick={() => onToggle?.(str)}
          >
            {isEditing ? (
              <input
                className="string-chip-input"
                value={editState.draft}
                autoFocus
                onChange={e => setEditState({ index: noteIndex, draft: e.target.value })}
                onClick={e => e.stopPropagation()}
                onBlur={() => commitEdit(noteIndex)}
                onKeyDown={e => {
                  if (e.key === 'Enter') e.currentTarget.blur()
                  if (e.key === 'Escape') setEditState(null)
                }}
              />
            ) : (
              <span
                className="string-chip-label"
                onClick={e => {
                  e.stopPropagation()
                  setEditState({ index: noteIndex, draft: openNote })
                }}
              >
                {openNote}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
