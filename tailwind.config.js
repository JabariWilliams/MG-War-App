/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // ================================
        // NEW WORLD THEME COLORS (HY-PHEN CASE)
        // ================================
        "nw-obsidian": "var(--nw-bg)",
        "nw-panel": "var(--nw-panel)",
        "nw-gold": "var(--nw-gold)",
        "nw-gold-soft": "var(--nw-gold-soft)",
        "nw-parchment-soft": "var(--nw-parchment-soft)",

        // optional palettes
        "nw-gold-bright": "#F6D98D",
        "nw-gold-soft2": "#C7A96B",
        "nw-gold-glow": "rgba(246, 217, 141, 0.45)",

        "nw-parchment": "#E0D6C2",
        "nw-parchment-light": "#C4BBA7",

        "nw-obsidian-deep": "#0B0D12",
        "nw-obsidian-light": "#181A20",
      },

      fontFamily: {
        body: ["Inter", "system-ui", "sans-serif"],
        display: ["Cinzel", "serif"],
      },
    },
  },
  plugins: [],
};
