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
        pixora: {
          bg: '#0f1013',
          surface: '#18191e',
          elevated: '#22242c',
          border: '#2c2f38',
          hover: '#2f333d',
          active: '#393e4a',
          accent: '#6366f1',
          'accent-hover': '#4f46e5',
          selection: '#38bdf8',
          guide: '#f43f5e',
          text: '#f3f4f6',
          'text-muted': '#9ca3af',
          'text-dim': '#6b7280',
          danger: '#ef4444',
          success: '#10b981',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'pixora-sm': '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.4)',
        'pixora-md': '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.5)',
        'pixora-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.6), 0 4px 6px -4px rgba(0, 0, 0, 0.6)',
        'pixora-modal': '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
      },
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      },
    },
  },
  plugins: [],
}
