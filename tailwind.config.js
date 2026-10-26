/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        prisma: {
          orange: {
            DEFAULT: '#F59E0B',
            dark: '#D97706',
            light: '#FCD34D'
          },
          teal: {
            DEFAULT: '#1E6F68',
            dark: '#154E49',
            light: '#2E8B82'
          },
          text: {
            primary: '#2D2C2D',
            secondary: '#696668'
          },
          border: '#C8D1D9',
          surface: '#F9FAFB'
        }
      }
    },
  },
  plugins: [],
}
