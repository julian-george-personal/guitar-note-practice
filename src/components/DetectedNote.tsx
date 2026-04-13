import './DetectedNote.css'

export default function DetectedNote({ detected, isMatch }: { detected: string | null; isMatch: boolean }) {
  return <div id="detected" className={isMatch ? 'match' : ''}>{detected ?? '—'}</div>
}
