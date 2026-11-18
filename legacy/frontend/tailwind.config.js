/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'rgb(var(--canvas) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        elevated: 'rgb(var(--elevated) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        petal: {
          50: '#fdf5f3',
          100: '#fbe9e5',
          200: '#f6d3cc',
          300: '#efb3a8',
          400: '#e28d7c',
          500: '#d26f5c',
          600: '#bd5543',
          700: '#9e4437',
          800: '#823b32',
          900: '#6c352e',
          950: '#3f1c17',
        },
        sage: {
          50: '#f2f8f3',
          100: '#e0efe3',
          200: '#c2dfc8',
          300: '#96c6a3',
          400: '#66a678',
          500: '#458a5c',
          600: '#336f48',
          700: '#2a5a3b',
          800: '#254a33',
          900: '#1f3e2b',
          950: '#12291c',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 24px 60px -30px rgba(28, 25, 23, 0.35)',
        card: '0 1px 2px rgba(28, 25, 23, 0.04), 0 16px 40px -24px rgba(28, 25, 23, 0.22)',
        glow: '0 20px 70px -20px rgba(210, 111, 92, 0.45)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        float: 'float 8s ease-in-out infinite',
        shimmer: 'shimmer 1.8s linear infinite',
        'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
