import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'prsonal.biscuit',
  appName: 'PRsonal',
  webDir: 'dist',
  android: {
    backgroundColor: '#0f0f0f',
    // Allow mixed content for local dev server
    allowMixedContent: true,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_notify',
      iconColor: '#e8ff47',
      sound: 'beep',
    },
  },
}

export default config
