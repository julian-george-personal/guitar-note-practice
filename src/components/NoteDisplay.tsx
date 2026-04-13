import './NoteDisplay.css'

export default function NoteDisplay({ note, correct }: { note: string; correct: boolean }) {
  return <div id="note" className={correct ? 'correct' : ''}>{note}</div>
}
