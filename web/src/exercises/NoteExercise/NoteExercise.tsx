import { useState, useCallback } from 'react'
import { randomNote, type AudioData } from '../../lib/audio'
import ScaleInput from '../../components/ScaleInput/ScaleInput'
import ExerciseFrame from '../ExerciseFrame/ExerciseFrame'
import { storage } from '../../storage'

export default function NoteExercise({ audio }: { audio: AudioData }) {
  const [scale, setScale] = useState<string | null>(() => storage.scale.get() || null)

  const generateNextNote = useCallback(
    (prev: string | null) => randomNote(prev, scale),
    [scale]
  )

  return (
    <ExerciseFrame audio={audio} generateNextNote={generateNextNote} displayNote={t => t}>
      <ScaleInput onCommit={setScale} />
    </ExerciseFrame>
  )
}
