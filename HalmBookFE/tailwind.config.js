/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        "brand-primary": "#a78bfa",
        "brand-secondary": "#fde047",
        "brand-bg": "#fefdf8",
        "brand-black": "#1a1a1a",
      },

      fontFamily: {
        heading: ['"Fredoka"', "sans-serif"],
        body: ['"Quicksand"', "sans-serif"],
      },

      boxShadow: {
        brutal: "4px 4px 0px 0px #1a1a1a",
        "brutal-lg": "8px 8px 0px 0px #1a1a1a",
        "brutal-sm": "2px 2px 0px 0px #1a1a1a",
      },
    },
  },

  plugins: [],
};
