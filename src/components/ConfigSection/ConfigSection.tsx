import { useState, useLayoutEffect } from 'react'
import './ConfigSection.css'
import { createPortal } from 'react-dom'

const Chevron = () => (
  <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="2,4 7,10 12,4" />
  </svg>
)

export default function ConfigSection({ children }: { children: React.ReactNode }) {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)
  useLayoutEffect(() => { setPortalTarget(document.getElementById('config-portal')) }, [])

  if (!portalTarget) return null
  return createPortal(
    <details className="config">
      <summary>Config <Chevron /></summary>
      <div className="config-content">{children}</div>
    </details>,
    portalTarget
  )
}
