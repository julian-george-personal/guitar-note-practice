import { useMemo } from 'react'
import { Note } from 'tonal'
import { type ExerciseConfig, buildStringPool, buildNotePool } from '../../lib/exercise-config'
import { parseTuning, openMidiForString, allStringNotes, parseFretRange, DEFAULT_TUNING, DEFAULT_FRET_RANGE } from '../../lib/string-logic'
import { pitchClass } from '../../lib/audio'
import './FretboardDiagram.css'

const FRET_W = 42
const STRING_H = 22
const ML = 28   // left margin
const MT = 10
const MB = 16   // bottom margin for fret markers
const DOT_R = 8

const MARKER_FRETS = new Set([3, 5, 7, 9, 12, 15, 17, 19, 21, 24])

export default function FretboardDiagram({ config }: { config: ExerciseConfig }) {
  const tuning = useMemo(
    () => parseTuning(config.tuning ?? DEFAULT_TUNING),
    [config.tuning]
  )

  const positions = useMemo(() => {
    const toPos = (t: { string: number; note: string }) => ({
      string: t.string,
      fret: (Note.midi(t.note) ?? 0) - openMidiForString(tuning, t.string),
      label: pitchClass(t.note),
    })
    if (config.mode === 'string') {
      return buildStringPool(config, 0).map(toPos)
    }
    const fretRange = parseFretRange(config.fretRange ?? DEFAULT_FRET_RANGE) ?? ([0, 11] as [number, number])
    const notePool = new Set(buildNotePool(config, 0))
    return allStringNotes(tuning, null, fretRange, config.enabledStrings ?? null)
      .filter(t => notePool.has(Note.pitchClass(t.note)))
      .map(toPos)
  }, [config, tuning])

  if (positions.length === 0) return null

  const frets = positions.map(p => p.fret)
  const minFret = Math.min(...frets)
  const maxFret = Math.max(...frets)
  const displayMin = minFret
  const displayMax = Math.max(maxFret, displayMin + 3)
  const numFrets = displayMax - displayMin + 1
  const numStrings = tuning.length

  const svgW = ML + numFrets * FRET_W + 16
  const svgH = MT + (numStrings - 1) * STRING_H + MB

  const sy = (str: number) => MT + (str - 1) * STRING_H
  const flx = (i: number) => ML + i * FRET_W
  const dx = (fret: number) => ML + (fret - displayMin) * FRET_W + FRET_W / 2

  return (
    <svg width={svgW} height={svgH} className="fretboard-diagram">
      {/* strings */}
      {Array.from({ length: numStrings }, (_, i) => i + 1).map(s => (
        <line
          key={s}
          x1={ML} y1={sy(s)}
          x2={ML + numFrets * FRET_W} y2={sy(s)}
          stroke="#555"
          strokeWidth={1 + (numStrings - s) * 0.2}
        />
      ))}

      {/* fret lines */}
      {Array.from({ length: numFrets + 1 }, (_, i) => i).map(i => (
        <line
          key={i}
          x1={flx(i)} y1={MT}
          x2={flx(i)} y2={sy(numStrings)}
          stroke={i === 0 && displayMin === 0 ? '#bbb' : '#555'}
          strokeWidth={i === 0 && displayMin === 0 ? 3 : 1}
        />
      ))}

      {/* fret position markers */}
      {Array.from({ length: numFrets }, (_, i) => displayMin + i).map(f =>
        MARKER_FRETS.has(f) ? (
          <circle key={f} cx={dx(f)} cy={sy(numStrings) + 9} r={2.5} fill="#555" />
        ) : null
      )}

      {/* fret start label */}
      {displayMin > 0 && (
        <text x={8} y={sy(Math.ceil(numStrings / 2)) + 4} className="fbd-label">
          {displayMin}
        </text>
      )}

      {/* note dots */}
      {positions.map((p, i) => (
        <g key={i}>
          <circle cx={dx(p.fret)} cy={sy(p.string)} r={DOT_R} className="fbd-dot" />
          <text x={dx(p.fret)} y={sy(p.string) + 4} className="fbd-dot-text">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  )
}
