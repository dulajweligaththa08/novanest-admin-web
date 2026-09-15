/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fe',
          300: '#a5bbfc',
          400: '#8193f8',
          500: '#6366f1',
          600: '#3b4fa8',
          700: '#1e3a8a',
          800: '#162d6e',
          900: '#0A1628',
          950: '#060d1a',
        },
        gold: {
          300: '#f0d080',
          400: '#e0b84a',
          500: '#C9A84C',
          600: '#a8882e',
          700: '#876a18',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
