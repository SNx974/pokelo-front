/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Pokélo brand colors
        yellow:  { DEFAULT: '#FFCB05', 50: '#FFFBE6', 100: '#FFF3B0', 400: '#FFDA40', 500: '#FFCB05', 600: '#E6B700' },
        blue:    { DEFAULT: '#2A75BB', 400: '#4A9DD4', 500: '#2A75BB', 600: '#1E5A94', 700: '#154980' },
        dark:    { DEFAULT: '#0D0F14', 50: '#1A1D24', 100: '#151820', 200: '#1E2230', 300: '#252A38', 400: '#2E3446', 500: '#3A4157' },
        // Rank colors
        rookie:  '#9E9E9E',
        novice:  '#4CAF50',
        expert:  '#2196F3',
        master:  '#9C27B0',
        champion:'#FFCB05',
        legend:  '#E91E63',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Rajdhani', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-yellow': '0 0 15px rgba(255,203,5,0.4), 0 0 30px rgba(255,203,5,0.15)',
        'glow-blue':   '0 0 15px rgba(42,117,187,0.4), 0 0 30px rgba(42,117,187,0.15)',
        'glow-red':    '0 0 15px rgba(239,68,68,0.4)',
        'card':        '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover':  '0 8px 32px rgba(0,0,0,0.6)',
      },
      backgroundImage: {
        'gradient-pokelo': 'linear-gradient(135deg, #0D0F14 0%, #151820 50%, #1A2035 100%)',
        'gradient-yellow': 'linear-gradient(135deg, #FFCB05, #E6B700)',
        'gradient-blue':   'linear-gradient(135deg, #2A75BB, #154980)',
        'gradient-card':   'linear-gradient(135deg, rgba(42,117,187,0.1), rgba(255,203,5,0.05))',
      },
      animation: {
        'pulse-slow':   'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow':         'glow 2s ease-in-out infinite alternate',
        'slide-up':     'slideUp 0.3s ease-out',
        'fade-in':      'fadeIn 0.4s ease-out',
        'bounce-slow':  'bounce 2s infinite',
      },
      keyframes: {
        glow: {
          from: { boxShadow: '0 0 5px rgba(255,203,5,0.2)' },
          to:   { boxShadow: '0 0 20px rgba(255,203,5,0.6)' },
        },
        slideUp: {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
