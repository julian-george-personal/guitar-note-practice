import { useState, useCallback, useEffect } from 'react'
import { type AudioData } from '../lib/audio'
import { useNoteMatch } from '../hooks/useNoteMatch'
import NoteDisplay from '../components/NoteDisplay'
import DetectedNote from '../components/DetectedNote'
import VolumeBar from '../components/VolumeBar'
import ConfigSection from '../components/ConfigSection'

type MatchFn = (detected: string, target: string) => boolean

interface ExerciseFrameProps<T> {
  audio: AudioData
  generateNextNote: (prev: T | null) => T
  displayNote: (t: T) => string
  matchNote?: (t: T) => string
  matchFn?: MatchFn
  label?: (t: T) => string
  children?: React.ReactNode
}

export default function ExerciseFrame<T,>({
  audio, generateNextNote, displayNote, matchNote, matchFn, label, children,
}: ExerciseFrameProps<T>) {
  const [target, setTarget] = useState<T>(() => generateNextNote(null))

  useEffect(() => { setTarget(generateNextNote(null)) }, [generateNextNote])

  const advance = useCallback(() => setTarget(t => generateNextNote(t)), [generateNextNote])

  const noteForMatch = (matchNote ?? displayNote)(target)
  const { correct, isMatch } = useNoteMatch(noteForMatch, audio.note, advance, matchFn)

  return (
    <div>
      {children && <ConfigSection>{children}</ConfigSection>}
      {label && <div id="string-label">{label(target)}</div>}
      <NoteDisplay note={displayNote(target)} correct={correct} />
      <div className="detected-row">
        <div className="volume-bar-spacer" aria-hidden="true" />
        <DetectedNote detected={audio.note} isMatch={isMatch} />
        <VolumeBar db={audio.db} />
      </div>
    </div>
  )
}
