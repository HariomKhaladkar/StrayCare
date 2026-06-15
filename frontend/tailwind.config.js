// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary':   '#6366f1', // Indigo-500
        'secondary': '#4f46e5', // Indigo-700
        'accent':    '#f97316', // Orange-500
        'teal':      '#14b8a6', // Teal-500
        'rose':      '#f43f5e', // Rose-500
        'gold':      '#f59e0b', // Amber-500
        'light-gray':'#f1f5f9', // Slate-100

        // Gradients helpers
        'grad-from': '#6366f1',
        'grad-via':  '#8b5cf6',
        'grad-to':   '#ec4899',
      },
      fontFamily: {
        'sans': ['Inter', 'Poppins', 'sans-serif'],
      },
      keyframes: {
        'fade-in-down': {
          '0%':   { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-up': {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center'  },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(99,102,241,0.4)' },
          '50%':      { boxShadow: '0 0 40px rgba(139,92,246,0.8)' },
        },
        'spin-slow': {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-in-down': 'fade-in-down 0.7s ease both',
        'fade-in-up':   'fade-in-up 0.7s ease both',
        'float':        'float 3s ease-in-out infinite',
        'shimmer':      'shimmer 2.5s linear infinite',
        'pulse-glow':   'pulse-glow 2s ease-in-out infinite',
        'spin-slow':    'spin-slow 8s linear infinite',
      },
      backgroundSize: {
        '200': '200% auto',
      },
    },
  },
  plugins: [],
}