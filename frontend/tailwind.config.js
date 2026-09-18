/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Syne"', "sans-serif"],
        sans: ['"Figtree"', "sans-serif"],
      },
      colors: {
        ink: "#0C1F1C",
        sand: "#EEF3F0",
        mist: "#F7FAF8",
        panel: "#FFFFFF",
        line: "#D2DED8",
        muted: "#5C726A",
        accent: "#E8472A",
        teal: "#0F766E",
        up: "#047857",
        down: "#BE123C",
      },
      boxShadow: {
        soft: "0 18px 50px -28px rgba(12, 31, 28, 0.35)",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fade: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        rise: "rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
        "rise-late": "rise 0.85s 0.12s cubic-bezier(0.22, 1, 0.36, 1) both",
        "rise-later": "rise 0.9s 0.22s cubic-bezier(0.22, 1, 0.36, 1) both",
        fade: "fade 0.6s ease both",
      },
    },
  },
  plugins: [],
};
