export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        fn: {
          bg: '#0a0e1a',
          card: '#151c2c',
          border: '#1e2d45',
          blue: '#00d4ff',
          yellow: '#f7c948',
          purple: '#9b59f5',
          red: '#ff4757',
          green: '#2ecc71',
          orange: '#ff6b35',
        }
      },
      fontFamily: {
        fn: ['"Barlow Condensed"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
