import { useState, useRef, useCallback } from 'react'
import { Note } from 'tonal'
import { pitchClass } from '../lib/audio'
import { AUDIO_CONFIG } from '../lib/audio-config'

type MatchFn = (detected: string, target: string) => boolean

const defaultMatch: MatchFn = (detected, target) => pitchClass(detected) === target

export function useNoteMatch(
  target: string,
  detected: string | null,
  onAdvance: () => void,
  matchFn: MatchFn = defaultMatch,
) {
  const [correct, setCorrect] = useState(false)
  const matchStart = useRef<number | null>(null)
  const lockedOctave = useRef<number | null>(null)
  const advancing = useRef(false)

  const resetTimer = () => { matchStart.current = null; lockedOctave.current = null }

  const check = useCallback(() => {
    if (!detected || advancing.current) {
      if (!detected) resetTimer()
      return
    }

    if (pitchClass(detected) === pitchClass(target)) {
      if (!matchStart.current && matchFn(detected, target)) {
        matchStart.current = performance.now()
        lockedOctave.current = Note.octave(detected) ?? null
      }
      const detectedOct = Note.octave(detected)
      const octaveOk = lockedOctave.current == null || detectedOct == null
        || detectedOct >= lockedOctave.current
      if (matchStart.current && octaveOk) {
        if (performance.now() - matchStart.current > AUDIO_CONFIG.noteHoldMs) {
          advancing.current = true
          resetTimer()
          setCorrect(true)
          setTimeout(() => {
            onAdvance()
            setCorrect(false)
            advancing.current = false
          }, 300)
        }
      } else {
        resetTimer()
      }
    } else {
      resetTimer()
    }
  }, [target, detected, onAdvance, matchFn])

  check()

  const isMatch = detected != null && matchFn(detected, target)

  return { correct, isMatch }
}
