/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5D9B89',
          foreground: '#FFFFFF',
          hover: '#4A8275',
          light: '#E0F2EE',
        },
        secondary: {
          DEFAULT: '#9F9FED',
          foreground: '#FFFFFF',
          light: '#E6E6FA',
          hover: '#8B8BD9',
        },
        background: {
          DEFAULT: '#FAFAF9',
          paper: '#FFFFFF',
          subtle: '#F5F5F4',
        },
        foreground: {
          DEFAULT: '#334155',
          muted: '#64748B',
          light: '#94A3B8',
        },
        accent: {
          DEFAULT: '#F28F8F',
          foreground: '#FFFFFF',
          yellow: '#FDE68A',
          blue: '#BFDBFE',
        },
        border: '#E7E5E4',
        input: '#F5F5F4',
        success: '#86EFAC',
        warning: '#FCD34D',
        error: '#FDA4AF',
        info: '#93C5FD',
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        lg: '1rem',
        md: '0.75rem',
        sm: '0.5rem',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0,0,0,0.04)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.08)',
        'float': '0 12px 32px rgba(93,155,137,0.15)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
