/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Brand AMANE — emerald accent (cohérence web)
        brand: {
          50:  '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        // Surface tokens (semantic)
        ink: {
          DEFAULT: '#09090b',     // zinc-950
          card: 'rgba(255,255,255,0.03)',
          border: 'rgba(255,255,255,0.10)',
          borderHover: 'rgba(255,255,255,0.20)',
        },
        // Risk levels (cohérence web)
        risk: {
          low: '#10b981',
          medium: '#3b82f6',
          high: '#f59e0b',
          critical: '#f43f5e',
          uncertain: '#a855f7',
        },
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
