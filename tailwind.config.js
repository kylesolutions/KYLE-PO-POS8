/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Scans Front.jsx
  ],
  theme: {
    extend: {
      fontFamily: {
        dubai: ['Dubai Regular', 'sans-serif'],
        'dubai-light': ['Dubai Light', 'sans-serif'],
        'dubai-medium': ['Dubai Medium', 'sans-serif'],
        'dubai-bold': ['Dubai Bold', 'sans-serif'],
      },
      colors: {
        primary: '#2a410e', // From front.css .category-btn
        borderBlue: '#002c07',
        scrollbar: '#f3b27d',
      },
    },
  },
  plugins: [],
}