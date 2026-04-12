import { useState, useEffect, useCallback } from 'react'

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

function randomNote(current: string | null) {
  let note: string
  do { note = NOTES[Math.floor(Math.random() * NOTES.length)] } while (note === current)
  return note
}

export default function App() {
  const [note, setNote] = useState(() => randomNote(null))

  const next = useCallback(() => setNote(n => randomNote(n)), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); next() } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next])

  return <div id="note" onClick={next}>{note}</div>
}
