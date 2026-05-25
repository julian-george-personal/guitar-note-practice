import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'net.juliangeorge.fretboarder',
  appName: 'Fretboarder',
  webDir: 'web/dist',
  ios: {
    contentInset: 'never',
    infoPlist: {
      NSMicrophoneUsageDescription: 'Fretboarder uses the microphone to detect the notes you play on guitar.',
    },
  },
}

export default config
