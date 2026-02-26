import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /**
         * All colors map to CSS custom properties defined in globals.css
         * — NO hardcoded values here (Princípio I da Constituição).
         */
        "color-bg": "var(--color-bg)",
        "color-main": "var(--color-main)",
        "color-secondary": "var(--color-secondary)",
        "color-tertiary": "var(--color-tertiary)",
        "color-headline": "var(--color-headline)",
        "color-paragraph": "var(--color-paragraph)",
        "color-button": "var(--color-button)",
        "color-button-text": "var(--color-button-text)",
        "color-highlight": "var(--color-highlight)",
        "color-link": "var(--color-link)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Playfair Display", "serif"],
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};

export default config;
