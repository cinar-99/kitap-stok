/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Source Serif 4"', '"Georgia"', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          950: '#1c1a17',
          900: '#26221d',
        },
        paper: {
          50: '#fbf8f2',
          100: '#f4eee1',
        },
        brass: {
          500: '#b8863b',
          600: '#9c6f2e',
        },
        forest: {
          600: '#2f5d4e',
          700: '#25493d',
        },
      },
    },
  },
  plugins: [],
}
