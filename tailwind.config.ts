import type { Config } from 'tailwindcss';

// Design tokens for the dark navy / teal system (see ChurnIQ landing inspiration).
// The `ink` scale is an inverted neutral ramp: low numbers = dark surfaces,
// high numbers = light text. This keeps the semantic class names used across
// the app (text-ink-800 = heading, bg-ink-50 = page) working on a dark theme.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Text',
          'Helvetica Neue',
          'sans-serif',
        ],
        display: ['Sora', 'Inter', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        // Inverted neutral ramp for a dark UI.
        ink: {
          50: '#0a1628', // page base (deep navy)
          100: '#1a2b45', // borders / track fills / subtle surfaces
          200: '#25384f', // elevated hairlines
          400: '#8fa1b8', // muted / secondary text
          600: '#b7c4d6', // body text
          800: '#e6edf5', // headings
          900: '#ffffff', // max contrast
        },
        // Base surface tokens for panels.
        surface: {
          DEFAULT: '#0d1b30',
          raised: '#11203a',
          sunken: '#091423',
        },
        accent: { DEFAULT: '#2dd4bf', hover: '#5eead4' },
        cyan: { glow: '#0ea5e9' },
        success: '#34d399',
        warn: '#f59e0b',
        danger: '#ef5a6f',
      },
      letterSpacing: { tightest: '-0.022em' },
      boxShadow: {
        soft: '0 1px 3px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.35)',
        glass: '0 1px 0 rgba(255,255,255,0.04) inset, 0 30px 90px rgba(0,0,0,0.45)',
        glow: '0 8px 30px rgba(45,212,191,0.28)',
      },
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
};

export default config;
