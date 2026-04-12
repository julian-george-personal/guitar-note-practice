import { useState, useRef, useCallback } from 'react'
import { pitchClass } from '../lib/audio'

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
  const advancing = useRef(false)

  const check = useCallback(() => {
    if (!detected || advancing.current) {
      if (!detected) matchStart.current = null
      return
    }

    if (matchFn(detected, target)) {
      if (!matchStart.current) matchStart.current = performance.now()
      if (performance.now() - matchStart.current > 200) {
        advancing.current = true
        matchStart.current = null
        setCorrect(true)
        setTimeout(() => {
          onAdvance()
          setCorrect(false)
          advancing.current = false
        }, 400)
      }
    } else {
      matchStart.current = null
    }
  }, [target, detected, onAdvance, matchFn])

  check()

  const isMatch = detected != null && matchFn(detected, target)

  return { correct, isMatch }
}
