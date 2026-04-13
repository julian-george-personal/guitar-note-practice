import { useState } from 'react'
import './DetectedNote.css'

const TIPS = [
  'Play harder — a stronger attack gives the detector more signal to work with.',
  'Move closer to your mic, or position it near the soundhole.',
  'Reduce background noise; the detector can lock onto ambient sound.',
]

export default function DetectedNote({ detected, isMatch }: { detected: string | null; isMatch: boolean }) {
  const [open, setOpen] = useState(false)

  return (
    <div id="detected-wrapper" className={open ? 'tips-open' : ''} onClick={() => setOpen(o => !o)}>
      <div id="detected" className={isMatch ? 'match' : ''}>{detected ?? '—'}</div>
      <div id="detected-tooltip">
        <p>If the app isn't detecting notes well:</p>
        <ul>
          {TIPS.map((tip, i) => <li key={i}>{tip}</li>)}
        </ul>
      </div>
    </div>
  )
}
