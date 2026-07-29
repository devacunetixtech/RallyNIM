module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        nimiq: {
          gold: '#E0A82E',
          yellow: '#FFC107',
          blue: '#1F2538',
          dark: '#101420',
          light: '#F8F9FA'
        },
        brand: {
          primary: '#E0A82E',       // Nimiq Gold
          secondary: '#E65100',     // Deep Orange accent
          background: '#0B0D17',    // Deep slate black
          surface: '#151926',       // Semi-translucent surface
          accent: '#00B0FF'         // Cyber blue highlight
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        glow: '0 0 15px rgba(224, 168, 46, 0.4)'
      },
      backdropBlur: {
        glass: '16px'
      }
    }
  },
  plugins: []
}
