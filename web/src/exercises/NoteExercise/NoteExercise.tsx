import { useState, useCallback } from 'react'
import { randomNote, type AudioData } from '../../lib/audio'
import ScaleInput from '../../components/ScaleInput/ScaleInput'
import ExerciseFrame from '../ExerciseFrame/ExerciseFrame'
import { storage } from '../../storage'
import { type ExerciseModeProps } from '../../components/ConfigSection/ConfigSection'

interface NoteExerciseProps extends ExerciseModeProps {
  audio: AudioData
}

export default function NoteExercise({ audio, exercise, onExerciseChange }: NoteExerciseProps) {
  const [scale, setScale] = useState<string | null>(() => storage.scale.get() || null)

  const generateNextNote = useCallback(
    (prev: string | null) => randomNote(prev, scale),
    [scale]
  )

  return (
    <ExerciseFrame audio={audio} generateNextNote={generateNextNote} displayNote={t => t} exercise={exercise} onExerciseChange={onExerciseChange}>
      <ScaleInput onCommit={setScale} />
    </ExerciseFrame>
  )
}
