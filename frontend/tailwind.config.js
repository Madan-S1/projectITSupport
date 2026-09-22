/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        graphite: "#0F172A",
        canvas: "#F8FAFC",
        ink: "#0F172A",
        mist: "#64748B",
        hairline: "#E2E8F0",
        circuit: "#0EA5E9",
        "circuit-dark": "#0284C7",
        // Priority semantics
        "priority-low": "#10B981",
        "priority-medium": "#F59E0B",
        "priority-high": "#F97316",
        "priority-critical": "#EF4444",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "IBM Plex Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "IBM Plex Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        DEFAULT: "6px",
        xl: "12px",
        '2xl': "16px",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.05)",
        card: "0 4px 20px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.04)",
        glow: "0 0 20px -5px rgba(14, 165, 233, 0.4)",
      },
      keyframes: {
        fadein: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSlow: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
      animation: {
        fadein: "fadein 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        pulseSlow: "pulseSlow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
