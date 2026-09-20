/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Sora", "system-ui", "sans-serif"],
      },
      colors: {
        // Primary: electric violet -> used for nav, primary actions
        brand: {
          50: "#f4f1ff",
          100: "#ebe4ff",
          200: "#d9ccff",
          300: "#bea6ff",
          400: "#9d75ff",
          500: "#7c3aed",
          600: "#6d28d9",
          700: "#5b21b6",
          800: "#4c1d95",
          900: "#3b1578",
        },
        // Accent: teal/cyan -> used for secondary highlights, communication
        aqua: {
          50: "#ecfeff",
          100: "#cffafe",
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
          700: "#0e7490",
        },
        // Accent: coral/amber -> warnings, coordination
        ember: {
          50: "#fff7ed",
          100: "#ffedd5",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
        },
        // Accent: emerald -> success, performance, "significant"
        leaf: {
          50: "#ecfdf5",
          100: "#d1fae5",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
        },
        // Accent: rose -> flags / non-significant / caution
        rose: {
          50: "#fff1f2",
          100: "#ffe4e6",
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48",
        },
        ink: {
          50: "#f7f7fb",
          100: "#eeeef5",
          200: "#d9d9e7",
          300: "#b8b8cf",
          400: "#8a8aa3",
          500: "#6b6b87",
          600: "#4b4b66",
          700: "#363654",
          800: "#232338",
          900: "#15151f",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(21,21,31,0.04), 0 8px 24px -8px rgba(76,29,149,0.10)",
        glow: "0 0 0 1px rgba(124,58,237,0.08), 0 10px 30px -10px rgba(124,58,237,0.35)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #7c3aed 0%, #6d28d9 45%, #4c1d95 100%)",
        "aqua-gradient": "linear-gradient(135deg, #22d3ee 0%, #0891b2 100%)",
        "ember-gradient": "linear-gradient(135deg, #fb923c 0%, #ea580c 100%)",
        "leaf-gradient": "linear-gradient(135deg, #34d399 0%, #059669 100%)",
      },
      borderRadius: {
        xl2: "1.1rem",
      },
    },
  },
  plugins: [],
};
