import { createContext, useContext, useEffect, useState, createElement, type ReactNode } from 'react'

interface DebugContextValue {
  debugOpen: boolean
  analyser: AnalyserNode | null
  setAnalyser: (a: AnalyserNode) => void
}

const DebugContext = createContext<DebugContextValue>({
  debugOpen: false,
  analyser: null,
  setAnalyser: () => {},
})

export function DebugProvider({ children }: { children: ReactNode }) {
  const [debugOpen, setDebugOpen] = useState(false)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === '`') setDebugOpen(prev => !prev)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return createElement(DebugContext.Provider, { value: { debugOpen, analyser, setAnalyser } }, children)
}

export function useDebugMode(): DebugContextValue {
  return useContext(DebugContext)
}
