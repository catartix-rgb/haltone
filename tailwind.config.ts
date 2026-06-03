import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        // Display: editorial, slightly mechanical
        display: ['var(--font-display)', 'serif'],
        // Body: humanist sans, warm and technical
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        // Mono: precise, for numeric values
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        // Atmospheric palette — soft whites, aqua, iridescent
        aqua: {
          50: 'oklch(98% 0.012 200)',
          100: 'oklch(95% 0.022 200)',
          200: 'oklch(90% 0.045 200)',
          300: 'oklch(82% 0.075 200)',
          400: 'oklch(72% 0.095 200)',
          500: 'oklch(62% 0.110 200)',
          600: 'oklch(52% 0.105 200)',
          700: 'oklch(42% 0.090 200)',
          800: 'oklch(32% 0.070 200)',
          900: 'oklch(22% 0.050 200)',
          950: 'oklch(15% 0.035 220)',
        },
        ink: {
          // Slightly blueish blacks
          950: 'oklch(12% 0.020 240)',
          900: 'oklch(18% 0.025 240)',
          800: 'oklch(25% 0.025 235)',
          700: 'oklch(35% 0.022 230)',
        },
        mist: {
          // Soft warm whites
          50: 'oklch(99% 0.005 80)',
          100: 'oklch(97% 0.008 90)',
          200: 'oklch(94% 0.012 100)',
        },
      },
      backdropBlur: {
        xs: '2px',
        '4xl': '72px',
      },
      animation: {
        'breathe': 'breathe 8s ease-in-out infinite',
        'drift': 'drift 24s ease-in-out infinite',
        'shimmer': 'shimmer 3s linear infinite',
        'fade-up': 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { opacity: '0.55', transform: 'scale(1) translate(0, 0)' },
          '50%': { opacity: '0.85', transform: 'scale(1.08) translate(2%, -2%)' },
        },
        drift: {
          '0%, 100%': { transform: 'translate(0%, 0%) rotate(0deg)' },
          '33%': { transform: 'translate(3%, -2%) rotate(2deg)' },
          '66%': { transform: 'translate(-2%, 3%) rotate(-1deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        // Layered, soft, never harsh
        'glass-sm': '0 1px 0 0 rgba(255,255,255,0.4) inset, 0 0 0 1px rgba(255,255,255,0.08), 0 8px 24px -8px rgba(0,30,60,0.12)',
        'glass-md': '0 1px 0 0 rgba(255,255,255,0.5) inset, 0 0 0 1px rgba(255,255,255,0.10), 0 16px 48px -12px rgba(0,30,60,0.18)',
        'glass-lg': '0 1px 0 0 rgba(255,255,255,0.6) inset, 0 0 0 1px rgba(255,255,255,0.12), 0 32px 80px -16px rgba(0,30,60,0.24)',
        'iridescent': '0 0 0 1px rgba(180,220,255,0.3) inset, 0 0 40px -8px rgba(120,200,220,0.4)',
      },
    },
  },
  plugins: [],
}

export default config
