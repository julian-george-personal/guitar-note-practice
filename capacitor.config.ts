import type { CapacitorConfig } from '@capacitor/cli'

const dev = !!process.env.CAPACITOR_DEV

const config: CapacitorConfig = {
  appId: 'net.juliangeorge.fretboarder',
  appName: 'Fretboarder',
  webDir: 'web/dist',
  ...(dev && { server: { url: 'http://localhost:5173', cleartext: true } }),
  ios: {
    contentInset: 'never',
    infoPlist: {
      NSMicrophoneUsageDescription: 'Fretboarder uses the microphone to detect the notes you play on guitar.',
    },
  },
}

export default config
