/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.25rem',
        lg: '1.5rem',
      },
      screens: {
        xl: '1180px',
      },
    },
    extend: {
      colors: {
        shop: {
          red: '#D70018',
          navy: '#071A2D',
          bg: '#F4F6F8',
          surface: '#FFFFFF',
          softBlue: '#EAF2FF',
          text: '#111827',
          muted: '#6B7280',
          border: '#E5E7EB',
          success: '#16A34A',
          warning: '#F59E0B',
          error: '#DC2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(17, 24, 39, 0.06)',
        cardHover: '0 8px 20px rgba(17, 24, 39, 0.10)',
      },
    },
  },
  plugins: [],
}
