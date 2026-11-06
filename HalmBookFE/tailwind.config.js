/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        "brand-primary": "#a78bfa",
        "brand-secondary": "#fde047",
        "brand-bg": "#fefdf8",
        "brand-black": "#1a1a1a",
        paper: {
          50: '#FAF8F5',
          100: '#F5F2EB',
          200: '#EAE5D9',
          DEFAULT: '#F7F4EE',
          surface: '#FFFEFA',
          border: '#E3DDD0',
        },
        ink: {
          50: '#F5F5F4',
          300: '#A8A6A1',
          muted: '#66645E',
          DEFAULT: '#1E1F1D',
          pure: '#111210',
        },
        wine: {
          DEFAULT: '#8E3038',
          light: '#A83B46',
          dark: '#6F252C',
        },
        gold: {
          DEFAULT: '#B8860B',
          light: '#D4AF37',
        },
        night: {
          DEFAULT: '#111210',
          bg: '#111210',
          surface: '#181916',
          card: '#20221E',
          border: '#2C2E29',
          text: '#EDE9DF',
          muted: '#96938B',
        }
      },

      fontFamily: {
        heading: ['"Fredoka"', "sans-serif"],
        body: ['"Quicksand"', "sans-serif"],
        sans: ['var(--font-ui)', 'Inter', 'sans-serif'],
        display: ['var(--font-display)', 'Inter', 'sans-serif'],
        metadata: ['var(--font-metadata)', 'Roboto', 'sans-serif'],
        editorial: ['var(--font-editorial)', 'Open Sans', 'sans-serif'],
        nunito: ['Nunito', 'sans-serif'],
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
