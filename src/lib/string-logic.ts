import { Note, Range } from 'tonal'
import { toSharp } from './audio'

const STANDARD_OCTAVES = [2, 2, 3, 3, 3, 4]
const FRETS = 11

export const DEFAULT_TUNING = 'EADGBE'

export function validateTuning(notes: string[]): boolean {
  if (notes.length < 4 || notes.length > 8) return false
  return notes.every(n => !Note.get(n).empty)
}

export interface StringTarget {
  string: number
  note: string
}

export function parseTuning(input: string): string[] {
  const notes: string[] = []
  for (let i = 0; i < input.length; i++) {
    const char = input[i]
    const next = input[i + 1]
    if (next === '#') {
      notes.push(char.toUpperCase() + '#')
      i++
    } else if (next === 'b') {
      notes.push(toSharp(char.toUpperCase() + 'b'))
      i++
    } else {
      notes.push(char.toUpperCase())
    }
  }
  return notes
}

function notesOnString(openNote: string, openOctave: number): string[] {
  const from = openNote + openOctave
  const toMidi = Note.midi(from)! + FRETS
  const to = Note.fromMidiSharps(toMidi)
  return Range.chromatic([from, to], { sharps: true })
}

export function randomStringNote(tuning: string[], current: StringTarget | null): StringTarget {
  let str: number
  let note: string
  do {
    str = Math.floor(Math.random() * tuning.length) + 1
    const stringIdx = tuning.length - str
    const notes = notesOnString(tuning[stringIdx], STANDARD_OCTAVES[stringIdx] ?? 3)
    note = notes[Math.floor(Math.random() * notes.length)]
  } while (current && str === current.string && note === current.note)
  return { string: str, note }
}

export function octaveMatch(detected: string, target: string): boolean {
  const d = toSharp(detected)
  const t = toSharp(target)
  if (Note.pitchClass(d) !== Note.pitchClass(t)) return false
  const dOct = Note.octave(d)
  const tOct = Note.octave(t)
  if (dOct == null || tOct == null) return false
  return Math.abs(dOct - tOct) <= 1
}

export function openNoteForString(tuning: string[], str: number): string {
  return tuning[tuning.length - str]
}
