/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f5fa',
          100: '#e1ecf5',
          200: '#c3daec',
          300: '#94bfe0',
          400: '#5e9ed0',
          500: '#3882be',
          600: '#2667a2',
          700: '#1e5284',
          800: '#1c466e',
          900: '#0f243a',
          950: '#0a1726',
        },
        navy: {
          800: '#111e38',
          900: '#0c1527',
          950: '#060a14',
        }
      }
    },
  },
  plugins: [],
}
