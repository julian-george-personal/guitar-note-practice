import { useRef, useEffect } from 'react'

/**
 * Disambiguates single click from double click. onClick fires after `delay` ms
 * only if no second click arrives; onDoubleClick fires immediately on the second
 * click and cancels the pending single-click.
 */
export function useClickIntent({
  onClick,
  onDoubleClick,
  delay = 250,
}: {
  onClick?: () => void
  onDoubleClick?: () => void
  delay?: number
}) {
  const timer = useRef<number | null>(null)

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const cancel = () => { if (timer.current) { clearTimeout(timer.current); timer.current = null } }

  return {
    onClick() {
      cancel()
      timer.current = window.setTimeout(() => { timer.current = null; onClick?.() }, delay)
    },
    onDoubleClick() {
      cancel()
      onDoubleClick?.()
    },
  }
}
