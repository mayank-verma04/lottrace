/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Brand
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        // Lot/Event Status Colors (semantic)
        status: {
          active: '#22c55e',
          recalled: '#ef4444',
          void: '#94a3b8',
          amended: '#f59e0b',
          pending: '#a855f7',
        },
        // CTE Event Type Colors
        cte: {
          creation: '#8b5cf6',
          receiving: '#3b82f6',
          transformation: '#f59e0b',
          shipping: '#10b981',
        },
      },
    },
  },
  plugins: [],
};
