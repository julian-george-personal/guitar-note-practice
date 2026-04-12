export default function DebugInfo({ freq, db }: { freq: number | null; db: number }) {
  return (
    <div id="debug">
      {freq ? `${Math.round(freq)} Hz` : '— Hz'} | {Math.round(db)} dB
    </div>
  )
}
