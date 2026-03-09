// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // Define our custom color palette
      colors: {
        'primary': '#3b82f6', // Blue-500
        'secondary': '#1e40af', // Blue-800
        'accent': '#facc15', // Yellow-400
        'light-gray': '#f3f4f6', // Gray-100
      },
      // Add a custom font
      fontFamily: {
        'sans': ['Poppins', 'sans-serif'],
      }
    },
  },
  plugins: [],
}