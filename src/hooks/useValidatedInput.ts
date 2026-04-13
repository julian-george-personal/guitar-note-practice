import { useState } from 'react'

interface Options {
  persist?: (value: string) => void   // called on valid commit (e.g. storage.scale.set)
  onCommit?: (value: string) => void  // optional parent state notification
  revertOnInvalid?: boolean           // if true, resets to last committed on invalid blur
  store?: boolean                     // if false, skips calling persist even if provided (default true)
}

export function useValidatedInput(
  initial: string,
  validate: (value: string) => boolean,
  options: Options = {}
) {
  const [value, setValue] = useState(initial)
  const [committed, setCommitted] = useState(initial)
  const isValid = validate(value)

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)
  const set = (v: string) => setValue(v)

  const onBlur = () => {
    if (validate(value)) {
      setCommitted(value)
      if (options.store !== false) options.persist?.(value)
      options.onCommit?.(value)
    } else if (options.revertOnInvalid) {
      setValue(committed)
    }
  }

  return { value, set, onChange, onBlur, isValid, committed }
}
