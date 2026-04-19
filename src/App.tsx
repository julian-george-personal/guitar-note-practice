import { useState, useCallback, useEffect, useRef } from 'react'
import './App.css'
import { startListening, type AudioData } from './lib/audio'
import { useDebugMode } from './hooks/useDebugMode'
import NoteExercise from './exercises/NoteExercise/NoteExercise'
import StringExercise from './exercises/StringExercise/StringExercise'

enum Status { Idle, Loading, Listening }

const EXERCISES = { note: NoteExercise, string: StringExercise } as const
type ExerciseKey = keyof typeof EXERCISES

export default function App() {
  const [status, setStatus] = useState(Status.Idle)
  const [audio, setAudio] = useState<AudioData>({ note: null, freq: null, db: -Infinity })
  const [exercise, setExercise] = useState<ExerciseKey>('note')

  const { setAnalyser } = useDebugMode()
  const wakeLock = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    if (status !== Status.Listening) return
    const acquire = async () => {
      if (document.visibilityState !== 'visible') return
      try { wakeLock.current = await navigator.wakeLock.request('screen') } catch {}
    }
    acquire()
    document.addEventListener('visibilitychange', acquire)
    return () => {
      document.removeEventListener('visibilitychange', acquire)
      wakeLock.current?.release()
    }
  }, [status])

  const start = useCallback(async () => {
    setStatus(Status.Loading)
    const { analyser } = await startListening(setAudio)
    setAnalyser(analyser)
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
