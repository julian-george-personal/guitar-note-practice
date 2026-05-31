import { useState, useCallback, useMemo, useEffect, useRef, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import './StringExercise.css'
import { useValidatedInput } from '../../hooks/useValidatedInput'
import { Note } from 'tonal'
import { pitchClass, type AudioData } from '../../lib/audio'
import { DEFAULT_TUNING, DEFAULT_FRET_RANGE, parseTuning, parseFretRange, randomStringNote, allStringNotes, octaveMatch, openNoteForString, type StringTarget } from '../../lib/string-logic'
import ScaleInput from '../../components/ScaleInput/ScaleInput'
import TuningInput from '../../components/TuningInput/TuningInput'
import ExerciseFrame from '../ExerciseFrame/ExerciseFrame'
import { storage } from '../../storage'
import { useDebugMode } from '../../hooks/useDebugMode'
import FretboardDiagram from '../../components/FretboardDiagram/FretboardDiagram'
import { type ExerciseConfig } from '../../lib/exercise-config'
import { type ExerciseModeProps } from '../../components/ConfigSection/ConfigSection'

interface StringExerciseProps extends ExerciseModeProps {
  audio: AudioData
}

export default function StringExercise({ audio, exercise, onExerciseChange }: StringExerciseProps) {
  const [scale, setScale] = useState<string | null>(() => storage.scale.get() || null)

  const [tuningNotes, setTuningNotes] = useState<string[]>(() =>
    parseTuning(storage.tuning('string').get() || DEFAULT_TUNING)
  )

  const handleTuningChange = useCallback((notes: string[]) => {
    setTuningNotes(notes)
    storage.tuning('string').set(notes.join(''))
  }, [])

  const fretRangeInput = useValidatedInput(
    storage.fretRange.get() || DEFAULT_FRET_RANGE,
    (v) => parseFretRange(v) !== null,
    { persist: storage.fretRange.set, revertOnInvalid: true }
  )
  const fretRange = useMemo(() => parseFretRange(fretRangeInput.committed) ?? ([0, 11] as [number, number]), [fretRangeInput.committed])
  const [minStr, maxStr] = fretRangeInput.value.split('-')

  const allStrings = useMemo(() => Array.from({ length: tuningNotes.length }, (_, i) => i + 1), [tuningNotes.length])
  const [enabledStrings, setEnabledStrings] = useState<number[]>(() =>
    storage.enabledStrings.get() ?? allStrings
  )

  const toggleString = useCallback((str: number) => {
    setEnabledStrings(prev => {
      const next = prev.includes(str) ? prev.filter(s => s !== str) : [...prev, str]
      if (next.length === 0) return prev
      storage.enabledStrings.set(next)
      return next
    })
  }, [])

  const mounted = useRef(false)
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return }
    setEnabledStrings(allStrings)
  }, [allStrings])

  const [order, setOrder] = useState<'random' | 'ascending' | 'descending'>(
    () => (storage.order.get() as 'random' | 'ascending' | 'descending')
  )

  const sortedNotes = useMemo(() => {
    if (order === 'random') return []
    const notes = allStringNotes(tuningNotes, scale, fretRange, enabledStrings)
    if (order === 'ascending') {
      // For same pitch, prefer the lower string number (next string up).
      notes.sort((a, b) => (Note.midi(a.note) ?? 0) - (Note.midi(b.note) ?? 0) || a.string - b.string)
    } else {
      // For same pitch, prefer the higher string number (next string down).
      notes.sort((a, b) => (Note.midi(b.note) ?? 0) - (Note.midi(a.note) ?? 0) || b.string - a.string)
    }
    // Drop repeated pitches — each pitch should appear on one string only.
    return notes.filter((n, i) => i === 0 || Note.midi(n.note) !== Note.midi(notes[i - 1].note))
  }, [tuningNotes, scale, fretRange, enabledStrings, order])

  const { debugOpen } = useDebugMode()
  const [fretboardPortal, setFretboardPortal] = useState<HTMLElement | null>(null)
  useLayoutEffect(() => { setFretboardPortal(document.getElementById('fretboard-portal')) }, [])

  const debugConfig = useMemo<ExerciseConfig>(() => ({
    description: '',
    mode: 'string',
    tuning: tuningNotes.join(''),
    fretRange: fretRangeInput.committed,
    enabledStrings,
    scales: scale ? [scale] : undefined,
  }), [tuningNotes, fretRangeInput.committed, enabledStrings, scale])

  const seqIndex = useRef(0)

  const generateNextNote = useCallback(
    (prev: StringTarget | null): StringTarget => {
      if (order === 'random') return randomStringNote(tuningNotes, prev, scale, fretRange, enabledStrings)
      if (prev === null) { seqIndex.current = 0; return sortedNotes[0] }
      seqIndex.current = (seqIndex.current + 1) % sortedNotes.length
      return sortedNotes[seqIndex.current]
    },
    [order, tuningNotes, scale, fretRange, enabledStrings, sortedNotes]
  )

  return (
    <>
    <ExerciseFrame
      audio={audio}
      generateNextNote={generateNextNote}
      displayNote={t => pitchClass(t.note)}
      matchNote={t => t.note}
      matchFn={octaveMatch}
      label={t => `String ${t.string} (${openNoteForString(tuningNotes, t.string)})`}
      exercise={exercise}
      onExerciseChange={onExerciseChange}
    >
      <div className="input-group">
        <label id="strings-label">Strings</label>
        <TuningInput
          tuningNotes={tuningNotes}
          onChange={handleTuningChange}
          enabledStrings={enabledStrings}
          onToggle={toggleString}
        />
      </div>
      <ScaleInput onCommit={setScale} />
      <div className="input-group">
        <label id="order-label">Order</label>
        <select id="order-select" value={order} onChange={e => {
          const v = e.target.value as 'random' | 'ascending' | 'descending'
          setOrder(v)
          storage.order.set(v)
        }}>
          <option value="random">Random</option>
          <option value="ascending">Ascending</option>
          <option value="descending">Descending</option>
        </select>
      </div>
      <div className="input-group">
        <label id="fret-label">Fret Range</label>
        <div className="fret-range">
          <input id="fret-min-input" type="text" value={minStr ?? ''}
            onChange={e => fretRangeInput.set(`${e.target.value}-${maxStr ?? ''}`)}
            onBlur={fretRangeInput.onBlur}
          />
          <span>–</span>
          <input id="fret-max-input" type="text" value={maxStr ?? ''}
            onChange={e => fretRangeInput.set(`${minStr ?? ''}-${e.target.value}`)}
            onBlur={fretRangeInput.onBlur}
          />
        </div>
        {!fretRangeInput.isValid && <span className="input-error">Invalid range</span>}
      </div>
    </ExerciseFrame>
    {debugOpen && fretboardPortal && createPortal(<FretboardDiagram config={debugConfig} />, fretboardPortal)}
    </>
  )
}
