/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Chakra Petch"', "Inter", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#070B14",
        panel: "#101826",
        line: "#1E2A3D",
        accent: "#7C5CFF",
      },
    },
  },
  plugins: [],
};
