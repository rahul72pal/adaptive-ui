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
        brand: {
          50: '#f5f3ff',
          100: '#e9ddff',
          200: '#cfbcff',
          300: '#b69df8',
          400: '#9a79f0',
          500: '#7c52e4',
          600: '#6750a4',
          700: '#4f378a',
          800: '#3a266a',
          900: '#22005d',
        },
        surface: {
          bright: '#fdf7ff',
          dim: '#ded8e0',
          container: '#f2ecf4',
          high: '#ece6ee',
          highest: '#e6e0e9',
          variant: '#e6e0e9',
        },
        ink: {
          primary: '#1d1b20',
          secondary: '#494551',
          muted: '#7a7582',
        }
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'lg': '1rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'subtle': '0 4px 12px rgba(0, 0, 0, 0.03)',
        'elevated': '0 12px 32px rgba(0, 0, 0, 0.08)',
        'glow': '0 0 20px rgba(103, 80, 164, 0.25)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
