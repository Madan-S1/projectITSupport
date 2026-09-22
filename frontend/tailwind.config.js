/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Dark Glass Cyber Palette
        graphite: "#0B0F19",
        canvas: "#0B0F19",
        ink: "#F8FAFC",
        mist: "#94A3B8",
        hairline: "#1E293B",
        circuit: "#38BDF8",
        "circuit-dark": "#0284C7",
        // Priority semantics with neon tones
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
        DEFAULT: "8px",
        xl: "14px",
        '2xl': "20px",
        '3xl': "24px",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.4)",
        card: "0 10px 30px -5px rgba(0, 0, 0, 0.5), 0 0 1px 1px rgba(255, 255, 255, 0.05)",
        neonSky: "0 0 25px -5px rgba(56, 189, 248, 0.35)",
        neonEmerald: "0 0 25px -5px rgba(16, 185, 129, 0.35)",
        neonRose: "0 0 25px -5px rgba(239, 68, 68, 0.35)",
        neonAmber: "0 0 25px -5px rgba(245, 158, 11, 0.35)",
      },
      keyframes: {
        fadein: {
          "0%": { opacity: "0", transform: "translateY(10px) scale(0.99)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.6", transform: "scale(0.97)" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(1000%)" },
        }
      },
      animation: {
        fadein: "fadein 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        shimmer: "shimmer 2s infinite",
        pulseGlow: "pulseGlow 3s ease-in-out infinite",
        scanline: "scanline 8s linear infinite",
      },
    },
  },
  plugins: [],
};
