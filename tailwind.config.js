/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'lora': ['Lora', 'serif'],
        'nunito': ['"Nunito Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

