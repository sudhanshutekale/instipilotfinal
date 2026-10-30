import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F8FAFC",
        foreground: "#0F172A",
        brand: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
          950: "#172554"
        },
        surface: {
          darkest: "#F1F5F9",
          DEFAULT: "#FFFFFF",
          card: "#FFFFFF",
          border: "#E2E8F0",
          borderSubtle: "#F1F5F9",
          hover: "#F8FAFC",
          active: "#EEF2F6"
        },
        command: {
          darkest: "#F8FAFC",
          bg: "#FFFFFF",
          card: "#FFFFFF",
          cardBorder: "#E2E8F0",
          cardHover: "#F8FAFC",
          subtle: "#64748B"
        },
        neon: {
          cyan: "#0284C7",
          violet: "#4F46E5",
          purple: "#7C3AED",
          emerald: "#059669",
          amber: "#D97706",
          rose: "#E11D48"
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'card': '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
        'card-hover': '0 10px 20px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.03)',
        'brand': '0 4px 14px 0 rgba(37, 99, 235, 0.25)',
        'glass': '0 4px 20px -2px rgba(15, 23, 42, 0.07)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
};
export default config;
