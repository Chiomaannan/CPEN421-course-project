/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Rajdhani', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        navy: {
          950: '#02060f',
          900: '#040b18',
          800: '#071422',
          700: '#0c1e35',
          600: '#112849',
          500: '#1a3a6b',
        },
        ghana: {
          red: '#ce1126',
          gold: '#fcd116',
          green: '#006b3f',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar': 'radar 3s linear infinite',
        'fadeIn': 'fadeIn 0.5s ease-out',
        'slideUp': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        radar: {
          '0%': { transform: 'scale(0.5)', opacity: '0.8' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
