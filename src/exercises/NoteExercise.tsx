import { useState, useCallback } from 'react'
import { randomNote, type AudioData } from '../lib/audio'
import { useNoteMatch } from '../hooks/useNoteMatch'
import NoteDisplay from '../components/NoteDisplay'
import DetectedNote from '../components/DetectedNote'
import DebugInfo from '../components/DebugInfo'

export default function NoteExercise({ audio }: { audio: AudioData }) {
  const [target, setTarget] = useState(() => randomNote(null))

  const advance = useCallback(() => {
    setTarget(t => randomNote(t))
  }, [])

  const { correct, isMatch } = useNoteMatch(target, audio.note, advance)

  return (
    <div>
      <NoteDisplay note={target} correct={correct} />
      <DetectedNote detected={audio.note} isMatch={isMatch} />
      <DebugInfo freq={audio.freq} db={audio.db} />
    </div>
  )
}
