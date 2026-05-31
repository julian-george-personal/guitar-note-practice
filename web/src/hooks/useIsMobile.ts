import { useState, useEffect, useMemo } from 'react'

export function useIsMobile(breakpoint = 600) {
  const mq = useMemo(() => window.matchMedia(`(max-width: ${breakpoint}px)`), [breakpoint])
  const [mobile, setMobile] = useState(mq.matches)
  useEffect(() => {
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [mq])
  return mobile
}
