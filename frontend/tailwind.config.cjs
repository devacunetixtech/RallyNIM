module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        nimiq: {
          gold: '#2767e2',          // New Brand Blue
          yellow: '#225fd5',        // Accent Blue
          blue: '#131c26',          // Dark Slate Blue
          dark: '#0d131a',          // Deep Base
          light: '#F8F9FA'
        },
        brand: {
          primary: '#2767e2',       // New Brand Blue
          secondary: '#225fd5',     // Accent Blue
          background: '#0d131a',    // Deep Base
          surface: '#16202c',       // Surface
          accent: '#00b0ff'         // Cyber blue highlight
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        glow: '0 0 15px rgba(39, 103, 226, 0.4)'
      },
      backdropBlur: {
        glass: '16px'
      }
    }
  },
  plugins: []
}
