import { useState } from 'react'
import { validateScale } from '../lib/string-logic'

export default function ScaleInput({ onCommit }: { onCommit: (scale: string | null) => void }) {
  const [input, setInput] = useState(() => localStorage.getItem('scale') || '')
  const isValid = input === '' || validateScale(input)

  return (
    <div className="input-group">
      <label id="scale-label">Scale</label>
      <input
        id="scale-input"
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onBlur={() => {
          if (isValid) {
            localStorage.setItem('scale', input)
            onCommit(input || null)
          }
        }}
      />
      {!isValid && <span className="input-error">No scale found</span>}
    </div>
  )
}
