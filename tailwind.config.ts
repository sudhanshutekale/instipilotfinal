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
        background: "#080C15",
        foreground: "#F8FAFC",
        brand: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
          800: "#3730A3",
          900: "#312E81",
          950: "#1E1B4B"
        },
        surface: {
          darkest: "#070B13",
          DEFAULT: "#0D1322",
          card: "#111827",
          border: "#1F2937",
          borderSubtle: "#1B2435",
          hover: "#1A2336",
          active: "#212D45"
        },
        command: {
          darkest: "#080C15",
          bg: "#0B101D",
          card: "#0F1626",
          cardBorder: "#1E293B",
          cardHover: "#162035",
          subtle: "#334155"
        },
        neon: {
          cyan: "#38BDF8",
          violet: "#818CF8",
          purple: "#6366F1",
          emerald: "#10B981",
          amber: "#F59E0B",
          rose: "#F43F5E"
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'subtle-glow': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.15), transparent 70%)',
        'soft-mesh': 'radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(16, 185, 129, 0.05) 0%, transparent 40%)',
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 10px 25px -3px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(99, 102, 241, 0.25)',
        'brand': '0 0 20px -3px rgba(99, 102, 241, 0.25)',
        'neon-cyan': '0 4px 14px 0 rgba(56, 189, 248, 0.2)',
        'neon-violet': '0 4px 14px 0 rgba(99, 102, 241, 0.25)',
        'glass': '0 8px 30px rgba(0, 0, 0, 0.35)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
};
export default config;
