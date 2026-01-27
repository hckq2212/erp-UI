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
      },
    },
  },
  plugins: [],
}