import { useState, useCallback, useEffect, useRef } from 'react'
import { Note } from 'tonal'
import { randomStringNote, parseTuning, parseFretRange, DEFAULT_TUNING, DEFAULT_FRET_RANGE, type StringTarget } from '../../lib/string-logic'
import {
  type ExerciseConfig, type StepState,
  CHROMATIC_NOTES, INITIAL_STEP_STATE,
  advanceStepPattern, buildNotePool, buildStringPool, buildSortedStringPool, buildSortedNotePool,
} from '../../lib/exercise-config'

export function useExerciseGenerators(config: ExerciseConfig | null) {
  const [displayScaleIdx, setDisplayScaleIdx] = useState(0)
  const scaleIdxRef = useRef(0)
  const noteCountRef = useRef(0)
  const seqIdxRef = useRef(0)
  const stepStateRef = useRef<StepState>(INITIAL_STEP_STATE)

  useEffect(() => {
    scaleIdxRef.current = 0
    noteCountRef.current = 0
    seqIdxRef.current = 0
    stepStateRef.current = INITIAL_STEP_STATE
    setDisplayScaleIdx(0)
  }, [config])

  const tickScale = useCallback((cfg: ExerciseConfig) => {
    if (!cfg.scales || cfg.scales.length <= 1) return
    noteCountRef.current++
    if (noteCountRef.current >= (cfg.scaleChangeEvery ?? 8)) {
      noteCountRef.current = 0
      seqIdxRef.current = 0
      stepStateRef.current = INITIAL_STEP_STATE
      const next = (scaleIdxRef.current + 1) % cfg.scales.length
      scaleIdxRef.current = next
      Promise.resolve().then(() => setDisplayScaleIdx(next))
    }
  }, [])

  const noteGenerator = useCallback((prev: string | null): string => {
    if (!config) return 'C'
    const pool = buildNotePool(config, scaleIdxRef.current)
    if (pool.length === 0) return 'C'

    const isFirst = prev === null
    const order = config.order ?? 'random'
    let note: string

    if (config.stepPattern) {
      const sorted = [...pool].sort((a, b) => CHROMATIC_NOTES.indexOf(a) - CHROMATIC_NOTES.indexOf(b))
      if (isFirst) {
        stepStateRef.current = INITIAL_STEP_STATE
        note = sorted[0]
      } else {
        const { item, nextState } = advanceStepPattern(sorted, stepStateRef.current, config.stepPattern)
        stepStateRef.current = nextState
        note = item
      }
    } else if (order === 'sequence') {
      if (isFirst) seqIdxRef.current = 0
      else seqIdxRef.current = (seqIdxRef.current + 1) % pool.length
      note = pool[seqIdxRef.current]
    } else if (order === 'ascending' || order === 'descending') {
      const sorted = buildSortedNotePool(pool, order)
      if (isFirst) seqIdxRef.current = 0
      else seqIdxRef.current = (seqIdxRef.current + 1) % sorted.length
      note = sorted[seqIdxRef.current]
    } else {
      const candidates = pool.filter(n => n !== prev)
      const draw = candidates.length > 0 ? candidates : pool
      note = draw[Math.floor(Math.random() * draw.length)]
    }

    if (!isFirst) tickScale(config)
    return note
  }, [config, tickScale])

  const stringGenerator = useCallback((prev: StringTarget | null): StringTarget => {
    if (!config) return { string: 1, note: 'E4' }

    const isFirst = prev === null
    const order = config.order ?? 'random'
    let target: StringTarget

    if (config.stepPattern) {
      const pool = buildStringPool(config, scaleIdxRef.current)
        .sort((a, b) => (Note.midi(a.note) ?? 0) - (Note.midi(b.note) ?? 0))
      if (pool.length === 0) return { string: 1, note: 'E4' }
      if (isFirst) {
        stepStateRef.current = INITIAL_STEP_STATE
        target = pool[0]
      } else {
        const { item, nextState } = advanceStepPattern(pool, stepStateRef.current, config.stepPattern)
        stepStateRef.current = nextState
        target = item
      }
    } else if (order === 'sequence') {
      const pool = buildStringPool(config, scaleIdxRef.current)
      if (pool.length === 0) return { string: 1, note: 'E4' }
      if (isFirst) seqIdxRef.current = 0
      else seqIdxRef.current = (seqIdxRef.current + 1) % pool.length
      target = pool[seqIdxRef.current]
    } else if (order === 'ascending' || order === 'descending') {
      const sorted = buildSortedStringPool(config, scaleIdxRef.current, order)
      if (sorted.length === 0) return { string: 1, note: 'E4' }
      if (isFirst) seqIdxRef.current = 0
      else seqIdxRef.current = (seqIdxRef.current + 1) % sorted.length
      target = sorted[seqIdxRef.current]
    } else {
      const tuning = parseTuning(config.tuning ?? DEFAULT_TUNING)
      const fretRange = parseFretRange(config.fretRange ?? DEFAULT_FRET_RANGE) ?? ([0, 11] as [number, number])
      const scale = config.scales?.[scaleIdxRef.current] ?? null
      if (config.targets && config.targets.length > 0) {
        const candidates = config.targets.filter(
          t => !prev || t.note !== prev.note || t.string !== prev.string,
        )
        const draw = candidates.length > 0 ? candidates : config.targets
        target = draw[Math.floor(Math.random() * draw.length)]
      } else {
        target = randomStringNote(tuning, prev, scale, fretRange, config.enabledStrings ?? null)
      }
    }

    if (!isFirst) tickScale(config)
    return target
  }, [config, tickScale])

  return { noteGenerator, stringGenerator, displayScaleIdx }
}
