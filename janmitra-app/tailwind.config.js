/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ink-navy': '#14213D',
        'aged-parchment': '#EDE6D2',
        'marigold': '#E8A33D',
        'seal-red': '#A6323A',
        'evidence-teal': '#2F6E68',
        'slate-ink': '#4A5064'
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        body: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      }
    },
  },
  plugins: [],
}
