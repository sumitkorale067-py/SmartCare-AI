/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          blue: "#2563eb",
          teal: "#0d9488",
        },
      },
      boxShadow: {
        soft: "0 18px 45px rgba(15, 23, 42, 0.15)",
      },
    },
  },
  plugins: [],
};

