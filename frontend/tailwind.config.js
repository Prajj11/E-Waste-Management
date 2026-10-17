/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        moss: {
          50: '#f3f8ef', 100: '#e2efd8', 200: '#c6dfb3', 300: '#a0c984', 400: '#79ae59',
          500: '#5a9340', 600: '#437630', 700: '#355d28', 800: '#2c4b23', 900: '#1f3418',
        },
        ink: '#17211b',
        paper: '#f7f6f1',
        amber: { 450: '#e7a22b' },
      },
      boxShadow: { card: '0 1px 2px rgba(23,33,27,.06), 0 8px 24px -12px rgba(23,33,27,.14)' },
    },
  },
  plugins: [],
};
