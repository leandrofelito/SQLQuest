import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          purple: '#8b5cf6',
          purple2: '#a78bfa',
          green: '#10b981',
          green2: '#34d399',
          gold: '#f59e0b',
          dark: '#080a0f',
          surface: '#0f1117',
          surface2: '#161820',
        },
      },
      screens: { xs: '375px' },
    },
  },
  plugins: [],
}

export default config
