import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'pw-bg':          '#F8F4EF',
        'pw-surface':     '#FFFFFF',
        'pw-ink':         '#1A1714',
        'pw-ink-soft':    '#2E2A26',
        'pw-muted':       '#8A8175',
        'pw-muted-light': '#B5ADA4',
        'pw-accent':      '#C4622D',
        'pw-accent-soft': '#F2E8E1',
        'pw-accent-mid':  '#E8795A',
        'pw-stone':       '#E6DFD8',
        'pw-stone-dark':  '#D4C9BE',
      },
      fontFamily: {
        serif: ['DM Serif Display', 'Georgia', 'serif'],
        sans:  ['DM Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'pw':      '8px',
        'pw-card': '16px',
        'pw-lg':   '20px',
      },
      boxShadow: {
        'pw-sm': '0 1px 3px rgba(26,23,20,0.08)',
        'pw-md': '0 4px 16px rgba(26,23,20,0.10)',
        'pw-lg': '0 12px 40px rgba(26,23,20,0.14)',
      },
    },
  },
  plugins: [],
};

export default config;
