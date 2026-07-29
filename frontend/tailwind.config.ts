import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-dark': '#0A0C0F',
        'surface-cards': '#111318',
        'accent-orange': '#FF6B00',
        'text-primary': '#E0E6EF',
        'text-secondary': '#8F9BB3',
        'text-muted': '#4A5568',
        'success-green': '#2ECC71',
        'error-red': '#E74C3C',
        'warning-yellow': '#F1C40F',
        'info-blue': '#3498DB',
        'elevation-highlight': '#2A2D3A',
        'chain-link-grey': '#3B414B',
        'strava-red': '#FC4C02',
        'podium-gold': '#FFD700',
        'podium-silver': '#C0C0C0',
        'podium-bronze': '#CD7F32',
      },
      fontFamily: {
        barlowCondensed: ['"Barlow Condensed"', 'sans-serif'],
        dmSans: ['"DM Sans"', 'sans-serif'],
        jetbrainsMono: ['"JetBrains Mono"', 'monospace'],
        bebasNeue: ['"Bebas Neue"', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};
export default config;
