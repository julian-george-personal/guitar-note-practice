export const storage = {
  scale: {
    get: () => localStorage.getItem('scale') ?? '',
    set: (v: string) => localStorage.setItem('scale', v),
  },
  tuning: {
    get: () => localStorage.getItem('tuning'),
    set: (v: string) => localStorage.setItem('tuning', v),
  },
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
}
