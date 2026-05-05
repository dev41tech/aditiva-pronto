/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Azul 41 Tech (extraído da logo)
        brand: {
          50:  '#eef0fb',
          100: '#d5d9f5',
          200: '#adb5eb',
          400: '#6674d8',
          500: '#3b4bc8',
          600: '#2f3da0',
          700: '#243180',
          800: '#1a2460',
          900: '#111840',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
