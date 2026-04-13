import { useState, useCallback, useEffect } from 'react'
import { randomNote, type AudioData } from '../lib/audio'
import { useNoteMatch } from '../hooks/useNoteMatch'
import NoteDisplay from '../components/NoteDisplay'
import DetectedNote from '../components/DetectedNote'
import VolumeBar from '../components/VolumeBar'
import ScaleInput from '../components/ScaleInput'
import ConfigSection from '../components/ConfigSection'
import { storage } from '../storage'

export default function NoteExercise({ audio }: { audio: AudioData }) {
  const [scale, setScale] = useState<string | null>(() => storage.scale.get() || null)
  const [target, setTarget] = useState(() => randomNote(null, scale))

  const advance = useCallback(() => {
    setTarget(t => randomNote(t, scale))
  }, [scale])

  useEffect(() => {
    setTarget(randomNote(null, scale))
  }, [scale])

  const { correct, isMatch } = useNoteMatch(target, audio.note, advance)

  return (
    <div>
      <ConfigSection>
        <ScaleInput onCommit={setScale} />
      </ConfigSection>
      <NoteDisplay note={target} correct={correct} />
      <div className="detected-row">
        <div className="volume-bar-spacer" aria-hidden="true" />
        <DetectedNote detected={audio.note} isMatch={isMatch} />
        <VolumeBar db={audio.db} />
      </div>
    </div>
  )
}
