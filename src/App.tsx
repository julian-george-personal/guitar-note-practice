import { useState, useRef, useCallback } from 'react'
import { randomNote, pitchClass, startListening, type AudioData } from './audio'

export default function App() {
  const [target, setTarget] = useState(() => randomNote(null))
  const [detected, setDetected] = useState<string | null>(null)
  const [freq, setFreq] = useState<number | null>(null)
  const [db, setDb] = useState<number>(-Infinity)
  const [listening, setListening] = useState(false)
  const [correct, setCorrect] = useState(false)
  const targetRef = useRef(target)
  const matchStart = useRef<number | null>(null)
  const advancing = useRef(false)

  const start = useCallback(() => {
    startListening(({ note, freq: f, db: d }: AudioData) => {
      setDetected(note)
      setFreq(f)
      setDb(d)

      if (!note || advancing.current) {
        if (!note) matchStart.current = null
        return
      }

      if (pitchClass(note) === targetRef.current) {
        if (!matchStart.current) matchStart.current = performance.now()
        if (performance.now() - matchStart.current > 200) {
          advancing.current = true
          matchStart.current = null
          setCorrect(true)
          setTimeout(() => {

            const next = randomNote(targetRef.current)
            targetRef.current = next
            setTarget(next)
            setDetected(null)
            setCorrect(false)
            advancing.current = false
          }, 400)
        }
      } else {
        matchStart.current = null
      }
    })
    setListening(true)
  }, [])

  if (!listening) {
    return <button id="start" onClick={start}>START</button>
  }

  return (
    <div>
      <div id="note" className={correct ? 'correct' : ''}>{target}</div>
      <div id="detected" className={detected && pitchClass(detected) === target ? 'match' : ''}>
        {detected ?? '—'}
      </div>
      <div id="debug">
        {freq ? `${Math.round(freq)} Hz` : '— Hz'} | {Math.round(db)} dB
      </div>
    </div>
  )
}
