import { YIN } from 'pitchfinder'
import { Note } from 'tonal'
import { AUDIO_CONFIG } from './audio-config'

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

// Normalize any note to use sharps (Gb -> F#, Bb4 -> A#4). Naturals pass through.
export function toSharp(note: string): string {
  if (note.length >= 2 && note[1] === 'b') {
    return Note.enharmonic(note) || note
  }
  return note
}

export function frequencyToNote(freq: number): string {
  return toSharp(Note.fromFreq(freq))
}

export function pitchClass(note: string): string {
  return Note.pitchClass(note)
}

export function randomNote(current: string | null): string {
  let note: string
  do { note = NOTES[Math.floor(Math.random() * NOTES.length)] } while (note === current)
  return note
}

function createAudioPipeline(ctx: AudioContext, stream: MediaStream) {
  const source = ctx.createMediaStreamSource(stream)

  const compressor = ctx.createDynamicsCompressor()
  compressor.threshold.value = AUDIO_CONFIG.compressor.threshold
  compressor.knee.value = AUDIO_CONFIG.compressor.knee
  compressor.ratio.value = AUDIO_CONFIG.compressor.ratio
  compressor.attack.value = AUDIO_CONFIG.compressor.attack
  compressor.release.value = AUDIO_CONFIG.compressor.release

  const gain = ctx.createGain()
  gain.gain.value = AUDIO_CONFIG.gain

  const analyser = ctx.createAnalyser()
  analyser.fftSize = AUDIO_CONFIG.fftSize

  source.connect(compressor).connect(gain).connect(analyser)
  return analyser
}

export interface AudioData {
  note: string | null
  freq: number | null
  db: number
}

export async function startListening(onData: (data: AudioData) => void) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const ctx = new AudioContext()
  const analyser = createAudioPipeline(ctx, stream)

  const detect = YIN({ sampleRate: ctx.sampleRate, ...AUDIO_CONFIG.yin })
  const buffer = new Float32Array(analyser.fftSize)

  const loop = () => {
    analyser.getFloatTimeDomainData(buffer)
    let rms = 0
    for (let i = 0; i < buffer.length; i++) rms += buffer[i] * buffer[i]
    const db = 20 * Math.log10(Math.sqrt(rms / buffer.length) || 1e-10)

    const freq = detect(buffer)
    const valid = freq != null && freq > AUDIO_CONFIG.minFreq && freq < AUDIO_CONFIG.maxFreq
    onData({
      note: valid ? frequencyToNote(freq) : null,
      freq: valid ? freq : null,
      db,
    })
    requestAnimationFrame(loop)
  }

  requestAnimationFrame(loop)
}
