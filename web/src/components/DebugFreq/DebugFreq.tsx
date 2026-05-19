import './DebugFreq.css'

interface DebugFreqProps {
  freq: number | null
}

export default function DebugFreq({ freq }: DebugFreqProps) {
  return (
    <div className="debug-freq">
      {freq != null ? `${freq.toFixed(1)} Hz` : '— Hz'}
    </div>
  )
}
