import './DebugOverlay.css'
import { useDebugMode } from '../../hooks/useDebugMode'

export default function DebugOverlay() {
  const { debugOpen } = useDebugMode()
  if (!debugOpen) return null
  return (
    <div className="debug-overlay">
      <div>debug mode on — press ` to turn off</div>
      <ul>
        <li>click for new note</li>
      </ul>
    </div>
  )
}
