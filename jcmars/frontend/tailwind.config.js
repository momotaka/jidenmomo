/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        jc: {
          blue: '#003366',
          red: '#CC0000',
          gold: '#FFD700',
        }
      }
    },
  },
  plugins: [],
}