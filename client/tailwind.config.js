/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    // Palette is locked to the six tokens in styles/tokens.css. Tailwind reads them
    // as variables so there is exactly one place to change a colour.
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      // Channel form so opacity modifiers (text-dust/70) actually compile.
      flare: 'rgb(var(--flare-rgb) / <alpha-value>)',
      zone: 'rgb(var(--zone-rgb) / <alpha-value>)',
      dust: 'rgb(var(--dust-rgb) / <alpha-value>)',
      steel: 'rgb(var(--steel-rgb) / <alpha-value>)',
      void: 'rgb(var(--void-rgb) / <alpha-value>)',
      blood: 'rgb(var(--blood-rgb) / <alpha-value>)',
      rule: 'var(--rule)',
    },
    fontFamily: {
      display: ['Archivo Variable', 'Archivo', 'Impact', 'sans-serif'],
      body: ['Sora Variable', 'Sora', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono Variable', 'JetBrains Mono', 'ui-monospace', 'monospace'],
    },
    extend: {
      screens: {
        rail: '900px', // HUD rail flips from bottom bar to left rail here
      },
      maxWidth: {
        prose: '62ch',
      },
    },
  },
  plugins: [],
};
