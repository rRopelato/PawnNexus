import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ash: {
          950: '#101112',
          900: '#181a1c',
          850: '#202326',
          800: '#292d31',
          700: '#3a4047',
        },
        ember: {
          500: '#d9a441',
          600: '#b7822b',
        },
        blood: {
          500: '#9b2f31',
          600: '#7b2528',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(217,164,65,0.18), 0 18px 48px rgba(0,0,0,0.36)',
      },
    },
  },
  plugins: [],
} satisfies Config;
