/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        risk: {
          low: '#10b981',       // Emerald
          moderate: '#f59e0b',  // Amber
          high: '#f97316',      // Orange
          severe: '#ef4444',    // Red
          notravel: '#881337',  // Deep Burgundy / Black
        }
      }
    },
  },
  plugins: [],
}
