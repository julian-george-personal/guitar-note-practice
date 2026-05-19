import type { ExerciseConfig } from './lib/exercise-config'

export const storage = {
  scale: {
    get: () => localStorage.getItem('scale') ?? '',
    set: (v: string) => localStorage.setItem('scale', v),
  },
  tuning: (exercise: string) => ({
    get: () => localStorage.getItem(`tuning:${exercise}`),
    set: (v: string) => localStorage.setItem(`tuning:${exercise}`, v),
  }),
  fretRange: {
    get: () => localStorage.getItem('fretRange'),
    set: (v: string) => localStorage.setItem('fretRange', v),
  },
  enabledStrings: {
    get: (): number[] | null => {
      const v = localStorage.getItem('enabledStrings')
      return v ? JSON.parse(v) : null
    },
    set: (v: number[]) => localStorage.setItem('enabledStrings', JSON.stringify(v)),
  },
  order: {
    get: () => localStorage.getItem('order') ?? 'random',
    set: (v: string) => localStorage.setItem('order', v),
  },
  exercisePrompt: {
    get: () => localStorage.getItem('exercisePrompt') ?? '',
    set: (v: string) => localStorage.setItem('exercisePrompt', v),
  },
  exerciseConfig: {
    get: (): ExerciseConfig | null => {
      const v = localStorage.getItem('exerciseConfig')
      return v ? JSON.parse(v) : null
    },
    set: (v: ExerciseConfig) => localStorage.setItem('exerciseConfig', JSON.stringify(v)),
  },
}
