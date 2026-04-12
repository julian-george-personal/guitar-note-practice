import { useState, useCallback, useMemo } from 'react'
import { pitchClass, type AudioData } from '../lib/audio'
import { useNoteMatch } from '../hooks/useNoteMatch'
import NoteDisplay from '../components/NoteDisplay'
import DetectedNote from '../components/DetectedNote'
import DebugInfo from '../components/DebugInfo'
import { DEFAULT_TUNING, parseTuning, validateTuning, randomStringNote, octaveMatch, openNoteForString } from '../lib/string-logic'

export default function StringExercise({ audio }: { audio: AudioData }) {
  const [tuningInput, setTuningInput] = useState(() => localStorage.getItem('tuning') || DEFAULT_TUNING)
  const [tuningCommitted, setTuningCommitted] = useState(tuningInput)
  const tuning = useMemo(() => parseTuning(tuningCommitted), [tuningCommitted])
  const [target, setTarget] = useState(() => randomStringNote(tuning, null))

  const advance = useCallback(() => {
    setTarget(t => randomStringNote(tuning, t))
  }, [tuning])

  const { correct, isMatch } = useNoteMatch(target.note, audio.note, advance, octaveMatch)

  return (
    <div>
      <div className="input-group" style={{ marginTop: 0, marginBottom: '1.5rem' }}>
      <label id="tuning-label">String Tuning</label>
      <input
        id="tuning-input"
        type="text"
        value={tuningInput}
        onChange={e => setTuningInput(e.target.value)}
        onBlur={() => {
          const parsed = parseTuning(tuningInput)
          if (validateTuning(parsed)) {
            setTuningCommitted(tuningInput)
            localStorage.setItem('tuning', tuningInput)
          } else {
            setTuningInput(tuningCommitted)
          }
        }}
        placeholder="e.g. EADGBE"
      />
      </div>
      <div id="string-label">String {target.string} ({openNoteForString(tuning, target.string)})</div>
      <NoteDisplay note={pitchClass(target.note)} correct={correct} />
      <DetectedNote detected={audio.note} isMatch={isMatch} />
      <DebugInfo freq={audio.freq} db={audio.db} />
    </div>
  )
}
