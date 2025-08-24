/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'ocean-teal': '#204F56',
        'sky-mist': '#9E8BF9',
        'ivory-whisper': '#FEFFFD',
        'lemon-zest': '#E6FD53',
        'deep-navy': '#1B263F',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};