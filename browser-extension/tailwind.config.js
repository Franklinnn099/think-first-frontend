/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        navy: {
          950: '#0A0F1E',
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
          600: '#475569',
        },
        brand: {
          indigo: '#4338CA',
          'indigo-light': '#6366F1',
          'indigo-subtle': '#EEF2FF',
          teal: '#14B8A6',
          'teal-subtle': '#F0FDFA',
          blue: '#60A5FA',
        },
        risk: {
          low: '#14B8A6',
          'low-bg': '#F0FDFA',
          'low-text': '#0F766E',
          medium: '#F59E0B',
          'medium-bg': '#FFFBEB',
          'medium-text': '#B45309',
          high: '#EF4444',
          'high-bg': '#FEF2F2',
          'high-text': '#B91C1C',
        },
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
        'card-md': '0 4px 6px rgba(15,23,42,0.07), 0 2px 4px rgba(15,23,42,0.05)',
        'card-lg': '0 10px 15px rgba(15,23,42,0.08), 0 4px 6px rgba(15,23,42,0.05)',
        intervention: '0 0 0 1px rgba(239,68,68,0.15), 0 8px 24px rgba(239,68,68,0.12)',
      },
    },
  },
  plugins: [],
}
