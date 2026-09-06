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
          bg: '#111b21',
          panel: '#202c33',
          surface: '#222e35',
          hover: '#2a3942',
          active: '#2a3942',
          green: '#00a884',
          greenHover: '#02906f',
          greenLight: '#25d366',
          outgoing: '#005c4b',
          incoming: '#202c33',
          textPrimary: '#e9edef',
          textSecondary: '#8696a0',
          border: '#222d34',
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

