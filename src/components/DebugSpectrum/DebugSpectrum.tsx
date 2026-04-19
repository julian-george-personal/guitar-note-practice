import { useEffect, useRef } from 'react'
import './DebugSpectrum.css'
import { useDebugMode } from '../../hooks/useDebugMode'

const WIDTH = 200
const SPECTRUM_HEIGHT = 50
const LABEL_HEIGHT = 14
const HEIGHT = SPECTRUM_HEIGHT + LABEL_HEIGHT
const MIN_DB = -100
const MAX_DB = -20
const MAX_FREQ = 8192
const LABELS = [0, 2000, 4000, 6000, 8000]

export default function DebugSpectrum() {
  const { analyser } = useDebugMode()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!analyser) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    // Each FFT bin covers binHz worth of frequency. e.g. at 44100 Hz sample rate
    // with fftSize 8192, each bin is ~5.4 Hz wide.
    const fftData = new Float32Array(analyser.frequencyBinCount)
    const sampleRate = analyser.context.sampleRate
    const binHz = sampleRate / analyser.fftSize
    const endBin = Math.min(Math.ceil(MAX_FREQ / binHz), analyser.frequencyBinCount)

    let rafId: number
    const draw = () => {
      // Fills fftData with dB values (negative floats) for each frequency bin.
      analyser.getFloatFrequencyData(fftData)
      ctx.clearRect(0, 0, WIDTH, HEIGHT)

      for (let i = 0; i < endBin; i++) {
        const db = fftData[i]
        // Map dB onto 0–1, clamping anything below MIN_DB to zero.
        const normalized = Math.max(0, (db - MIN_DB) / (MAX_DB - MIN_DB))
        const barH = normalized * SPECTRUM_HEIGHT
        const x = (i / endBin) * WIDTH
        const barW = WIDTH / endBin
        ctx.fillStyle = '#0f0'
        // Draw bar from the bottom up so louder = taller.
        ctx.fillRect(x, SPECTRUM_HEIGHT - barH, barW, barH)
      }

      // Hz labels along the bottom
      ctx.fillStyle = '#0f0'
      ctx.font = '8px monospace'
      ctx.textBaseline = 'top'
      for (const hz of LABELS) {
        const x = (hz / MAX_FREQ) * WIDTH
        ctx.textAlign = hz === 0 ? 'left' : hz === LABELS[LABELS.length - 1] ? 'right' : 'center'
        ctx.fillText(hz === 0 ? '0' : `${hz / 1000}k`, x, SPECTRUM_HEIGHT + 3)
      }

      rafId = requestAnimationFrame(draw)
    }

    rafId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafId)
  }, [analyser])

  return (
    <canvas
      ref={canvasRef}
      width={WIDTH}
      height={HEIGHT}
      className="debug-spectrum"
    />
  )
}
