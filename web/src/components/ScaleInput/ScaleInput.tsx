import './ScaleInput.css'
import { useValidatedInput } from '../../hooks/useValidatedInput'
import { validateScale } from '../../lib/string-logic'
import { storage } from '../../storage'

export default function ScaleInput({ onCommit }: { onCommit: (scale: string | null) => void }) {
  const { value, onChange, onBlur, isValid } = useValidatedInput(
    storage.scale.get(),
    (v) => v === '' || validateScale(v),
    {
      persist: storage.scale.set,
      onCommit: (v) => onCommit(v || null),
    }
  )

  return (
    <div className="input-group">
      <label id="scale-label">Scale</label>
      <input id="scale-input" type="text" value={value} onChange={onChange} onBlur={onBlur} />
      {!isValid && <span className="input-error">No scale found</span>}
    </div>
  )
}
