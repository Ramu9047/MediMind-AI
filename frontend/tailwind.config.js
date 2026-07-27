/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Sora', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        bgLight: '#F7F9F8',
        mistTeal: '#EAF6F3',
        mistCoral: '#FDF3EF',
        ink: '#16211F',
        inkMuted: '#5B6B68',
        tealPrimary: '#0F9B8E',
        tealDeep: '#0B7A70',
        coralWarm: '#F97362',
        amberWarn: '#F5A623',
        dangerRed: '#E1483D',
        successGreen: '#2FAE71',
        darkBg: '#0B1615',
        darkSurface: '#12211F',
      },
      boxShadow: {
        clinical: '0 4px 20px -2px rgba(15, 155, 142, 0.06), 0 2px 6px -1px rgba(22, 33, 31, 0.04)',
        clinicalHover: '0 10px 30px -4px rgba(15, 155, 142, 0.12), 0 4px 12px -2px rgba(22, 33, 31, 0.06)',
      },
    },
  },
  plugins: [],
}
