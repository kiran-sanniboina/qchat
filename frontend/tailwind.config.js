/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        wa: {
          bg: 'rgb(var(--wa-bg) / <alpha-value>)',
          panel: 'rgb(var(--wa-panel) / <alpha-value>)',
          surface: 'rgb(var(--wa-surface) / <alpha-value>)',
          hover: 'rgb(var(--wa-hover) / <alpha-value>)',
          active: 'rgb(var(--wa-active) / <alpha-value>)',
          green: '#00a884',
          greenHover: '#02906f',
          greenLight: '#25d366',
          outgoing: 'rgb(var(--wa-outgoing) / <alpha-value>)',
          incoming: 'rgb(var(--wa-incoming) / <alpha-value>)',
          textPrimary: 'rgb(var(--wa-text-primary) / <alpha-value>)',
          textSecondary: 'rgb(var(--wa-text-secondary) / <alpha-value>)',
          border: 'rgb(var(--wa-border) / <alpha-value>)',
          lightBg: '#f0f2f5',
          lightPanel: '#ffffff',
          lightSurface: '#f0f2f5',
          lightOutgoing: '#d9fdd3',
          lightIncoming: '#ffffff',
          lightTextPrimary: '#111b21',
          lightTextSecondary: '#667781',
          lightBorder: '#e9edef'
        },
        quantum: {
          cyan: '#00f2fe',
          blue: '#4facfe',
          purple: '#a855f7',
          violet: '#7c3aed',
          gold: '#f59e0b',
          emerald: '#10b981',
          danger: '#ef4444'
        }
      },
      fontFamily: {
        sans: ['Segoe UI', 'Helvetica Neue', 'Helvetica', 'Lucida Grande', 'Arial', 'sans-serif']
      }
    },
  },
  plugins: [],
}

