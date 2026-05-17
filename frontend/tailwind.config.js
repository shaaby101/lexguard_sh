/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#0f1117",
        "navy-light": "#1a1d2e",
        "navy-lighter": "#252840",
        critical: "#ef4444",
        high: "#f97316",
        medium: "#eab308",
        low: "#22c55e",
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};
