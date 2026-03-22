/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        yellow:  { DEFAULT: '#FFCB05', 400: '#FFD740', 500: '#FFCB05', 600: '#F59E0B' },
        blue:    { DEFAULT: '#2A75BB', 400: '#60a5fa', 500: '#2A75BB', 600: '#1a4a8a', 700: '#0d2a4a' },
        navy:    { DEFAULT: '#050d1a', 50: '#0d1f3c', 100: '#071428', 200: '#0a1628', 300: '#0f1e35', 400: '#1e3a5f', 500: '#1a2f50' },
        gold:    { DEFAULT: '#FFCB05', light: '#FFD740', dark: '#F59E0B' },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Rajdhani', 'Inter', 'system-ui', 'sans-serif'],
        bebas:   ['Bebas Neue', 'Rajdhani', 'sans-serif'],
      },
      boxShadow: {
        'gold':      '0 0 20px rgba(255,203,5,0.4)',
        'gold-lg':   '0 0 40px rgba(255,203,5,0.5)',
        'blue':      '0 0 20px rgba(42,117,187,0.4)',
        'card':      '0 4px 24px rgba(0,0,0,0.6)',
        'card-hover':'0 8px 40px rgba(0,0,0,0.8)',
        'inset-gold':'inset 0 1px 0 rgba(255,203,5,0.3)',
      },
      backgroundImage: {
        'stadium':  'radial-gradient(ellipse at 50% 0%, #1a3a6a 0%, #050d1a 60%)',
        'card-grad':'linear-gradient(180deg, #0d1f3c 0%, #071428 100%)',
        'gold-grad':'linear-gradient(135deg, #FFCB05, #F59E0B)',
        'blue-grad':'linear-gradient(135deg, #1a4a8a, #2A75BB)',
        'red-grad': 'linear-gradient(135deg, #7f1d1d, #c0392b)',
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'slide-up':   'slideUp 0.35s ease-out',
        'fade-in':    'fadeIn 0.4s ease-out',
        'bounce-sm':  'bounce 1.5s infinite',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
