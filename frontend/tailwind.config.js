/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        arcade: ['Orbitron', '"Chakra Petch"', 'sans-serif'],
        pixel: ['"Chakra Petch"', 'sans-serif'],
        retro: ['"Press Start 2P"', 'cursive'],
      },
      colors: {
        arcade: {
          green: '#16a34a',
          greenLight: '#22c55e',
          greenNeon: '#00ff66',
          greenDark: '#14532d',
          orange: '#ea580c',
          orangeLight: '#f97316',
          orangeNeon: '#ff6600',
          orangeDark: '#9a3412',
          black: '#09090b',
        },
        risk: {
          low: '#16a34a',
          moderate: '#f59e0b',
          high: '#ea580c',
          severe: '#dc2626',
          notravel: '#7f1d1d',
        }
      },
      boxShadow: {
        'arcade': '4px 4px 0px #09090b',
        'arcade-lg': '6px 6px 0px #09090b',
        'arcade-orange': '4px 4px 0px #ea580c',
        'arcade-green': '4px 4px 0px #16a34a',
        'arcade-press': '1px 1px 0px #09090b',
      }
    },
  },
  plugins: [],
}
