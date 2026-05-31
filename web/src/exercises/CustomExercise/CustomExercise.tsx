import { useState, useCallback } from 'react'
import './CustomExercise.css'
import { pitchClass, type AudioData } from '../../lib/audio'
import { parseTuning, octaveMatch, openNoteForString, DEFAULT_TUNING } from '../../lib/string-logic'
import { type ExerciseConfig, generateExerciseConfig } from '../../lib/exercise-config'
import ExerciseFrame from '../ExerciseFrame/ExerciseFrame'
import { storage } from '../../storage'
import { useExerciseGenerators } from './useExerciseGenerators'
import { useDebugMode } from '../../hooks/useDebugMode'
import FretboardDiagram from '../../components/FretboardDiagram/FretboardDiagram'
import { type ExerciseModeProps } from '../../components/ConfigSection/ConfigSection'

interface CustomExerciseProps extends ExerciseModeProps {
  audio: AudioData
}

export default function CustomExercise({ audio, exercise, onExerciseChange }: CustomExerciseProps) {
  const [config, setConfig] = useState<ExerciseConfig | null>(() => storage.exerciseConfig.get())
  const [prompt, setPrompt] = useState(() => storage.exercisePrompt.get())
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { noteGenerator, stringGenerator, displayScaleIdx } = useExerciseGenerators(config)
  const { debugOpen } = useDebugMode()

  const generate = useCallback(async () => {
    setLoading(true)
    setError(null)
    setProgress(null)
    try {
      const next = await generateExerciseConfig(prompt, setProgress)
      storage.exerciseConfig.set(next)
      setConfig(next)
      setProgress(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setLoading(false)
    }
  }, [prompt])

  const configUI = (
    <>
      <div className="input-group">
        <label className="prompt-label">Prompt</label>
        <textarea
          className="prompt-textarea"
          value={prompt}
          placeholder="e.g. A minor pentatonic box 1 at fret 5, ascending"
          onChange={e => { setPrompt(e.target.value); storage.exercisePrompt.set(e.target.value) }}
        />
      </div>
      <button className="generate-btn" onClick={generate} disabled={loading || !prompt.trim()}>
        {loading ? '…' : 'Generate'}
      </button>
      {loading && progress && <p className="generate-progress">{progress}</p>}
      {error && <span className="input-error">{error}</span>}
      {!config && <p className="exercise-description">Enter a prompt to generate an exercise.</p>}
      {config && <p className="exercise-description">{config.description}</p>}
      {config?.scales && config.scales.length > 1 && (
        <p className="current-scale">Scale: {config.scales[displayScaleIdx]}</p>
      )}
      {debugOpen && config && <FretboardDiagram config={config} />}
      {debugOpen && config && (
        <pre className="config-debug">{JSON.stringify(config, null, 2)}</pre>
      )}
    </>
  )

  const mode = config?.mode ?? 'empty'
  let frame: React.ReactNode
  if (!config) {
    frame = (
      <ExerciseFrame key={mode} audio={audio} generateNextNote={() => ''} displayNote={t => t} exercise={exercise} onExerciseChange={onExerciseChange}>
        {configUI}
      </ExerciseFrame>
    )
  } else if (config.mode === 'note') {
    frame = (
      <ExerciseFrame key={mode} audio={audio} generateNextNote={noteGenerator} displayNote={t => t} exercise={exercise} onExerciseChange={onExerciseChange}>
        {configUI}
      </ExerciseFrame>
    )
  } else {
    const tuning = parseTuning(config.tuning ?? DEFAULT_TUNING)
    frame = (
      <ExerciseFrame
        key={mode}
        audio={audio}
        generateNextNote={stringGenerator}
        displayNote={t => pitchClass(t.note)}
        matchNote={t => t.note}
        matchFn={octaveMatch}
        label={t => `String ${t.string} (${openNoteForString(tuning, t.string)})`}
        exercise={exercise}
        onExerciseChange={onExerciseChange}
      >
        {configUI}
      </ExerciseFrame>
    )
  }

  return frame
}
