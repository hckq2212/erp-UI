/** @type {import('tailwindcss').Config} */
import colors from 'tailwindcss/colors'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Map legacy `gray` names to the `slate` palette so existing classes work
        gray: colors.slate,
        primary: {
          DEFAULT: '#F38820',
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F38820',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
          hover: '#D97010',
        },
        brand: {
          DEFAULT: '#F38820',
          light: '#FFF7ED',
          hover: '#D97010',
        },
      },
    },
  },
  plugins: [],
}