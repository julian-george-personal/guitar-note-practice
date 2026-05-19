import { Note, Scale } from 'tonal'
import { toSharp } from './audio'
import { allStringNotes, parseFretRange, parseTuning, DEFAULT_FRET_RANGE, DEFAULT_TUNING, type StringTarget } from './string-logic'

export const CHROMATIC_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export interface ExerciseConfig {
  description: string
  mode: 'note' | 'string'
  notes?: string[]
  scales?: string[]
  targets?: { string: number; note: string }[]
  tuning?: string
  fretRange?: string
  enabledStrings?: number[]
  order?: 'random' | 'ascending' | 'descending' | 'sequence'
  stepPattern?: { forward: number; back: number; skip?: number }
  scaleChangeEvery?: number
}

export type StepState = { anchorIdx: number; cycleStep: number }
export const INITIAL_STEP_STATE: StepState = { anchorIdx: 0, cycleStep: 0 }

export function advanceStepPattern<T>(
  pool: T[],
  state: StepState,
  pattern: NonNullable<ExerciseConfig['stepPattern']>,
): { item: T; nextState: StepState } {
  const { forward, back, skip = 1 } = pattern
  const { anchorIdx, cycleStep } = state
  const cycleLen = forward + back

  const idx = cycleStep < forward
    ? anchorIdx + (cycleStep + 1) * skip
    : anchorIdx + forward * skip - (cycleStep - forward + 1) * skip

  const wrapped = ((idx % pool.length) + pool.length) % pool.length

  let newStep = cycleStep + 1
  let newAnchor = anchorIdx
  if (newStep >= cycleLen) {
    newStep = 0
    newAnchor = ((anchorIdx + (forward - back) * skip) % pool.length + pool.length) % pool.length
  }

  return { item: pool[wrapped], nextState: { anchorIdx: newAnchor, cycleStep: newStep } }
}

export function buildNotePool(config: ExerciseConfig, scaleIdx: number): string[] {
  if (config.notes && config.notes.length > 0) {
    const valid = config.notes.filter((n): n is string => typeof n === 'string')
    if (valid.length > 0) return valid
  }
  const name = config.scales?.[scaleIdx]
  if (!name) return CHROMATIC_NOTES
  const notes = Scale.get(name).notes.map(toSharp)
  return notes.length > 0 ? notes : CHROMATIC_NOTES
}

export function buildStringPool(config: ExerciseConfig, scaleIdx: number): StringTarget[] {
  if (config.targets && config.targets.length > 0) return config.targets
  const tuning = parseTuning(config.tuning ?? DEFAULT_TUNING)
  const fretRange = parseFretRange(config.fretRange ?? DEFAULT_FRET_RANGE) ?? ([0, 11] as [number, number])
  const scale = config.scales?.[scaleIdx] ?? null
  return allStringNotes(tuning, scale, fretRange, config.enabledStrings ?? null)
}

export function buildSortedStringPool(
  config: ExerciseConfig,
  scaleIdx: number,
  order: 'ascending' | 'descending',
): StringTarget[] {
  const pool = buildStringPool(config, scaleIdx)
  const sorted = [...pool]
  if (order === 'ascending') {
    sorted.sort((a, b) => (Note.midi(a.note) ?? 0) - (Note.midi(b.note) ?? 0) || a.string - b.string)
  } else {
    sorted.sort((a, b) => (Note.midi(b.note) ?? 0) - (Note.midi(a.note) ?? 0) || b.string - a.string)
  }
  return sorted.filter((n, i) => i === 0 || Note.midi(n.note) !== Note.midi(sorted[i - 1].note))
}

export function buildSortedNotePool(pool: string[], order: 'ascending' | 'descending'): string[] {
  const sorted = [...pool].sort((a, b) => CHROMATIC_NOTES.indexOf(a) - CHROMATIC_NOTES.indexOf(b))
  return order === 'ascending' ? sorted : sorted.reverse()
}

function extractJSON(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) return fenced[1].trim()
  const braced = text.match(/\{[\s\S]*\}/)
  if (braced) return braced[0]
  return text.trim()
}

function validateConfig(obj: unknown): ExerciseConfig {
  if (typeof obj !== 'object' || obj === null) throw new Error('Response is not a JSON object')
  const c = obj as Record<string, unknown>
  if (typeof c.description !== 'string') throw new Error('Missing field: description')
  if (c.mode !== 'note' && c.mode !== 'string') throw new Error(`Invalid mode: ${JSON.stringify(c.mode)}`)
  return c as unknown as ExerciseConfig
}

export async function generateExerciseConfig(
  prompt: string,
  onProgress: (msg: string) => void,
): Promise<ExerciseConfig> {
  onProgress('Generating…')
  const res = await fetch(import.meta.env.VITE_GENERATE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  })
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  const raw = await res.text()
  let parsed: unknown
  try {
    parsed = JSON.parse(extractJSON(raw))
  } catch {
    throw new Error(`Invalid JSON from model: ${raw.slice(0, 200)}`)
  }
  return validateConfig(parsed)
}
