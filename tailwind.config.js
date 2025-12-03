/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        nw: {
          obsidian: "var(--nw-bg)",
          panel: "var(--nw-panel)",
          gold: "var(--nw-gold)",
          goldSoft: "var(--nw-gold-soft)",
          parchmentSoft: "var(--nw-parchment-soft)",
        },
      },
      fontFamily: {
        body: ["Inter", "system-ui", "sans-serif"],
        display: ["Cinzel", "serif"],
      },
    },
  },
  plugins: [],
};
