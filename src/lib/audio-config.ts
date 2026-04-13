export const AUDIO_CONFIG = {
  // -- Compressor (applied first to tame peaks) --
  compressor: {
    // dB level where compression kicks in. Lower = more compression on quiet signals.
    threshold: -64,
    // dB range above threshold for soft-knee transition. Higher = gentler onset.
    knee: 44,
    // Amount of compression. 12:1 means 12dB of input above threshold = 1dB of output.
    ratio: 12,
    // Seconds to start compressing after signal exceeds threshold. 0 = instant.
    attack: 0,
    // Seconds to stop compressing after signal drops below threshold.
    release: 0.5,
  },

  // -- Gain (applied after compressor to boost overall level) --
  // Multiplier on the signal. Higher = louder input to the detector.
  // Needed because laptop mics pick up guitar quietly.
  gain: 20,

  // -- Analyser --
  // Number of samples per analysis frame. Bigger = better frequency resolution
  // but more latency. 8192 at 44.1kHz ≈ 186ms window. Needed for low guitar notes.
  fftSize: 8192,

  // -- YIN pitch detector --
  yin: {
    // Controls how periodic the signal must be for a pitch to be detected at all.
    // Raise if the detector fires on noise or muted strings; lower if it misses quiet notes.
    threshold: 0.4,
    // Secondary confidence filter applied after a candidate period is found.
    // Raise if you're getting ghost detections that survive the threshold; rarely needs tuning.
    probabilityThreshold: 0.1,
  },

  // -- Detection frequency range (Hz) --
  // Filters out results outside the guitar range.
  // 50 Hz covers drop tunings, 1400 Hz ≈ 24th fret high E.
  minFreq: 50,
  maxFreq: 1400,
}
