/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./App.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Montserrat', 'sans-serif'],
        sans: ['Montserrat', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
