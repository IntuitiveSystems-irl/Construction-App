import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // VBG Brand Colors
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#5A9FB8',  // Light teal from logo
          500: '#5A9FB8',  // Light teal from logo
          600: '#4A8FA8',
          700: '#4A7585',  // Dark teal from logo
          800: '#3A6575',
          900: '#2A5565',
        },
        accent: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#E8C547',  // Yellow/Gold accent from logo
          600: '#D8B537',
          700: '#C8A527',
          800: '#B89517',
          900: '#A88507',
        },
        // Dopamine hit colors (use sparingly!)
        delight: {
          pink: '#FF6B9D',      // Berry pink for success moments
          mint: '#00E5A0',      // Mint green for achievements
          purple: '#A78BFA',    // Soft purple for milestones
          neon: '#00FFA3',      // Neon green for streaks
        },
        // Map orange/yellow/red to teal for full rebranding
        orange: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#5A9FB8',
          500: '#5A9FB8',  // Light teal
          600: '#4A8FA8',
          700: '#4A7585',  // Dark teal
          800: '#3A6575',
          900: '#2A5565',
        },
        yellow: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#5A9FB8',
          500: '#5A9FB8',  // Light teal
          600: '#4A8FA8',
          700: '#4A7585',
          800: '#3A6575',
          900: '#2A5565',
        },
        red: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;
