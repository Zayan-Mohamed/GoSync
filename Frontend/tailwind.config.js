/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        deepOrange: "#FF6B00", // Main button color
        sunsetOrange: "#E65C00", // Hover color
        brightYellow: "#FFC300",
        lightYellow: "#FFF3CD",
        darkCharcoal: "#333333",
      },
    },
  },
  plugins: [],
};
