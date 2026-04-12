import { useState, useCallback, useMemo, useEffect } from 'react'
import { Note } from 'tonal'
import { pitchClass, toSharp, type AudioData } from '../lib/audio'
import { useNoteMatch } from '../hooks/useNoteMatch'
import NoteDisplay from '../components/NoteDisplay'
import DetectedNote from '../components/DetectedNote'
import DebugInfo from '../components/DebugInfo'
import { DEFAULT_TUNING, DEFAULT_FRET_RANGE, parseTuning, parseFretRange, randomStringNote, octaveMatch, openNoteForString } from '../lib/string-logic'
import ScaleInput from '../components/ScaleInput'
import ConfigSection from '../components/ConfigSection'

export default function StringExercise({ audio }: { audio: AudioData }) {
  const [scale, setScale] = useState<string | null>(() => localStorage.getItem('scale') || null)

  const [tuningNotes, setTuningNotes] = useState<string[]>(() =>
    parseTuning(localStorage.getItem('tuning') || DEFAULT_TUNING)
  )
  const tuning = tuningNotes

  const [editState, setEditState] = useState<{ index: number; draft: string } | null>(null)

  const commitChipEdit = useCallback((index: number) => {
    setEditState(prev => {
      if (!prev || prev.index !== index) return prev
      const n = Note.get(prev.draft.trim())
      if (!n.empty) {
        const note = toSharp(n.pc)
        setTuningNotes(notes => {
          const next = [...notes]
          next[index] = note
          localStorage.setItem('tuning', next.join(''))
          return next
        })
      }
      return null
    })
  }, [])

  const [fretInput, setFretInput] = useState(() => localStorage.getItem('fretRange') || DEFAULT_FRET_RANGE)
  const [fretCommitted, setFretCommitted] = useState(fretInput)
  const fretRange = parseFretRange(fretCommitted) ?? [0, 11]
  const isFretValid = parseFretRange(fretInput) !== null

  const allStrings = useMemo(() => Array.from({ length: tuningNotes.length }, (_, i) => i + 1), [tuningNotes.length])
  const [enabledStrings, setEnabledStrings] = useState<number[]>(() => {
    const saved = localStorage.getItem('enabledStrings')
    return saved ? JSON.parse(saved) : allStrings
  })

  const toggleString = useCallback((str: number) => {
    setEnabledStrings(prev => {
      const next = prev.includes(str) ? prev.filter(s => s !== str) : [...prev, str]
      if (next.length === 0) return prev
      localStorage.setItem('enabledStrings', JSON.stringify(next))
      return next
    })
  }, [])

  useEffect(() => {
    setEnabledStrings(allStrings)
  }, [tuningNotes.length])

  const [target, setTarget] = useState(() => randomStringNote(tuning, null, scale, fretRange, enabledStrings))

  const advance = useCallback(() => {
    setTarget(t => randomStringNote(tuning, t, scale, fretRange, enabledStrings))
  }, [tuning, scale, fretRange, enabledStrings])

  useEffect(() => {
    setTarget(randomStringNote(tuning, null, scale, fretRange, enabledStrings))
  }, [fretCommitted, scale, enabledStrings, tuningNotes])

  const { correct, isMatch } = useNoteMatch(target.note, audio.note, advance, octaveMatch)

  return (
    <div>
      <ConfigSection>
        <div className="input-group">
        <label id="strings-label">Strings</label>
        <div className="string-chips">
          {Array.from({ length: tuningNotes.length }, (_, i) => {
            const str = tuningNotes.length - i
            const noteIndex = tuningNotes.length - str
            const isEditing = editState?.index === noteIndex
            return (
              <div
                key={str}
                className={`string-chip${enabledStrings.includes(str) ? ' active' : ''}`}
                onClick={() => toggleString(str)}
              >
                {isEditing ? (
                  <input
                    className="string-chip-input"
                    value={editState.draft}
                    autoFocus
                    onChange={e => setEditState({ index: noteIndex, draft: e.target.value })}
                    onClick={e => e.stopPropagation()}
                    onBlur={() => commitChipEdit(noteIndex)}
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
                      setEditState({ index: noteIndex, draft: openNoteForString(tuningNotes, str) })
                    }}
                  >
                    {openNoteForString(tuningNotes, str)}
                  </span>
                )}
              </div>
            )
          })}
        </div>
        </div>
        <ScaleInput onCommit={setScale} />
        <div className="input-group">
          <label id="fret-label">Fret Range</label>
          <input
            id="fret-input"
            type="text"
            value={fretInput}
            onChange={e => setFretInput(e.target.value)}
            onBlur={() => {
              if (isFretValid) {
                setFretCommitted(fretInput)
                localStorage.setItem('fretRange', fretInput)
              }
            }}
          />
          {!isFretValid && <span className="input-error">Use format 0-11</span>}
        </div>
      </ConfigSection>
      <div id="string-label">String {target.string} ({openNoteForString(tuning, target.string)})</div>
      <NoteDisplay note={pitchClass(target.note)} correct={correct} />
      <DetectedNote detected={audio.note} isMatch={isMatch} />
      <DebugInfo freq={audio.freq} db={audio.db} />
    </div>
  )
}
