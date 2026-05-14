/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./store/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // MomPlan Admin brand
        brand: {
          50:  "#f0f0ff",
          100: "#e2e1ff",
          200: "#cbc7ff",
          300: "#ab9fff",
          400: "#8b72ff",
          500: "#6d47fc",
          600: "#5e2df1",
          700: "#4d20d6",
          800: "#3f1cad",
          900: "#321a85",
          950: "#1e0e52",
        },
        sidebar: {
          bg:     "#0f1117",
          hover:  "#1a1d27",
          border: "#1e2130",
          active: "#1e2540",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Plus Jakarta Sans", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        "4xl": "2rem",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-in": "slideIn 0.3s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      boxShadow: {
        "glow-brand": "0 0 30px rgba(109, 71, 252, 0.15)",
        "card": "0 1px 3px 0 rgba(0,0,0,.1), 0 1px 2px -1px rgba(0,0,0,.1)",
        "card-hover": "0 10px 25px -5px rgba(0,0,0,.12), 0 8px 10px -6px rgba(0,0,0,.08)",
      },
    },
  },
  plugins: [],
};
