import { Note, Range, Scale } from 'tonal'
import { toSharp } from './audio'

const STANDARD_OCTAVES = [2, 2, 3, 3, 3, 4]

export const DEFAULT_FRET_RANGE = '0-11'

export function parseFretRange(input: string): [number, number] | null {
  const match = input.match(/^(\d+)-(\d+)$/)
  if (!match) return null
  const min = parseInt(match[1]), max = parseInt(match[2])
  if (min >= max || min < 0 || max > 11 || max < 0) return null
  return [min, max]
}

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

function notesOnString(openNote: string, openOctave: number, fretMin: number, fretMax: number): string[] {
  const openMidi = Note.midi(openNote + openOctave)!
  const from = Note.fromMidiSharps(openMidi + fretMin)
  const to = Note.fromMidiSharps(openMidi + fretMax)
  return Range.chromatic([from, to], { sharps: true })
}

export function randomStringNote(tuning: string[], current: StringTarget | null, scale: string | null = null, fretRange: [number, number] = [0, 11], enabledStrings: number[] | null = null): StringTarget {
  const strings = enabledStrings && enabledStrings.length > 0 ? enabledStrings : Array.from({ length: tuning.length }, (_, i) => i + 1)
  let str: number
  let note: string
  let attempts = 0
  const [fretMin, fretMax] = fretRange
  do {
    str = strings[Math.floor(Math.random() * strings.length)]
    const stringIdx = tuning.length - str
    const allNotes = notesOnString(tuning[stringIdx], STANDARD_OCTAVES[stringIdx] ?? 3, fretMin, fretMax)
    const filtered = filterByScale(allNotes, scale)
    const pool = filtered.length > 0 ? filtered : allNotes
    note = pool[Math.floor(Math.random() * pool.length)]
    attempts++
  } while (attempts < 50 && current && str === current.string && note === current.note)
  return { string: str, note }
}

export function octaveMatch(detected: string, target: string): boolean {
  const d = toSharp(detected)
  const t = toSharp(target)
  if (Note.pitchClass(d) !== Note.pitchClass(t)) return false
  const dOct = Note.octave(d)
  const tOct = Note.octave(t)
  if (dOct == null || tOct == null) return false
  return dOct === tOct
}

export function validateScale(input: string): boolean {
  if (input === '') return true
  return !Scale.get(input).empty
}

function filterByScale(notes: string[], scale: string | null): string[] {
  if (!scale) return notes
  const scaleNotes = Scale.get(scale).notes.map(toSharp)
  return notes.filter(n => scaleNotes.includes(Note.pitchClass(n)))
}

export function openNoteForString(tuning: string[], str: number): string {
  return tuning[tuning.length - str]
}
