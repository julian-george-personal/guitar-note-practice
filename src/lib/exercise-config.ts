import { Note, Scale } from 'tonal'
import { CreateMLCEngine, type MLCEngine } from '@mlc-ai/web-llm'
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
  if (config.notes && config.notes.length > 0) return config.notes
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

const MODEL_ID = 'Llama-3.2-3B-Instruct-q4f16_1-MLC'

const SYSTEM_PROMPT = `You are a guitar practice exercise generator. Output ONLY valid JSON — no prose, no code fences.

Notes use sharps (C#, not Db). String numbers: 1=high E, 2=B, 3=G, 4=D, 5=A, 6=low E (standard tuning).
Standard string octaves: 6→E2, 5→A2, 4→D3, 3→G3, 2→B3, 1→E4.

JSON schema (all fields optional except description and mode):
{
  "description": "one-sentence description",
  "mode": "note" | "string",
  "notes": ["C","E","G"],
  "scales": ["C major"],
  "targets": [{"string":1,"note":"E4"}],
  "tuning": "EADGBE",
  "fretRange": "5-8",
  "enabledStrings": [1,2,3,4,5,6],
  "order": "random"|"ascending"|"descending"|"sequence",
  "stepPattern": {"forward":2,"back":1,"skip":1},
  "scaleChangeEvery": 8
}

mode "note": pitch-class recognition on any string/octave.
mode "string": player must find the exact note on the exact string.
stepPattern.skip: 1=adjacent degrees (default), 2=thirds, 3=fourths.`

let engine: MLCEngine | null = null

function extractJSON(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) return fenced[1].trim()
  const braced = text.match(/\{[\s\S]*\}/)
  if (braced) return braced[0]
  return text.trim()
}

export async function generateExerciseConfig(
  prompt: string,
  onProgress: (msg: string) => void,
): Promise<ExerciseConfig> {
  if (!engine) {
    engine = await CreateMLCEngine(MODEL_ID, {
      initProgressCallback: ({ text }) => onProgress(text),
    })
  }

  onProgress('Generating…')
  const resp = await engine.chat.completions.create({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.2,
    max_tokens: 600,
  })

  const raw = resp.choices[0].message.content ?? ''
  return JSON.parse(extractJSON(raw)) as ExerciseConfig
}
