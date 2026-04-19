import './VolumeBar.css'
import { AUDIO_CONFIG } from '../../lib/audio-config'

const MIN_DB = AUDIO_CONFIG.compressor.threshold + 20 * Math.log10(AUDIO_CONFIG.gain)
const MAX_DB = 0

export default function VolumeBar({ db }: { db: number }) {
  const fill = Math.max(0, Math.min(1, (db - MIN_DB) / (MAX_DB - MIN_DB))) * 100
  return (
    <div id="volume-bar">
      <div id="volume-fill" style={{ height: `${fill}%` }} />
    </div>
  )
}
