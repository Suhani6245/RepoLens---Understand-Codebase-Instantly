/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#0a0e14",
          surface: "#0f1420",
          elevated: "#151b2b",
        },
        border: {
          DEFAULT: "#1f2637",
          subtle: "#171d2b",
        },
        accent: {
          50: "#eef6ff",
          100: "#d9ecff",
          200: "#bcdcff",
          300: "#8ec6ff",
          400: "#59a6ff",
          500: "#3182f6",
          600: "#1e63e0",
          700: "#1a4fb8",
          800: "#1c4293",
          900: "#1c3974",
        },
        text: {
          primary: "#e6e9f0",
          secondary: "#9aa4b8",
          muted: "#6b7385",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Menlo", "monospace"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.3), 0 8px 24px -8px rgba(0,0,0,0.5)",
        glow: "0 0 0 1px rgba(49,130,246,0.4), 0 0 24px -4px rgba(49,130,246,0.35)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0, transform: "translateY(4px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.5 },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.25s ease-out",
        pulseSoft: "pulseSoft 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
