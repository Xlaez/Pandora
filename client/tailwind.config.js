/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Cinzel"', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        thames: {
          950: '#070E17',
          900: '#0B1522',
          800: '#132236',
          700: '#1D334E',
        },
        sovereign: {
          gold: '#E5B84B',
          amber: '#D99B26',
          cream: '#F4EFE6',
          terracotta: '#C96A4A',
          crimson: '#9E3328',
          emerald: '#1E6B4B',
        },
      },
    },
  },
  plugins: [],
};

