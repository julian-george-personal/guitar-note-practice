import { useState, useCallback } from 'react'
import './App.css'
import { startListening, type AudioData } from './lib/audio'
import NoteExercise from './exercises/NoteExercise'
import StringExercise from './exercises/StringExercise'

enum Status { Idle, Loading, Listening }

const EXERCISES = { note: NoteExercise, string: StringExercise } as const
type ExerciseKey = keyof typeof EXERCISES

export default function App() {
  const [status, setStatus] = useState(Status.Idle)
  const [audio, setAudio] = useState<AudioData>({ note: null, freq: null, db: -Infinity })
  const [exercise, setExercise] = useState<ExerciseKey>('note')

  const start = useCallback(async () => {
    setStatus(Status.Loading)
    await startListening(setAudio)
    setStatus(Status.Listening)
  }, [])

  if (status !== Status.Listening) {
    return (
      <button id="start" onClick={start} disabled={status === Status.Loading}>
        {status === Status.Loading ? <div className="spinner" /> : 'START'}
      </button>
    )
  }

  const Exercise = EXERCISES[exercise]

  return (
    <div>
      <Exercise audio={audio} />
      <div className="input-group">
        <label id="exercise-label">Exercise Mode</label>
        <select id="exercise-select" value={exercise} onChange={e => setExercise(e.target.value as ExerciseKey)}>
          <option value="note">Note</option>
          <option value="string">String</option>
        </select>
      </div>
      <div id="config-portal" />
    </div>
  )
}
