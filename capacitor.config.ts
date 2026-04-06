import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'br.com.sqlquest',
  appName: 'SQLQuest',
  webDir: 'out',
  server: {
    url: 'https://sqlquest.com.br',
    cleartext: false,
  },
  plugins: {
    AdMob: {
      appId: 'ca-app-pub-4150729063109368~4419072443',
    },
  },
}

export default config
