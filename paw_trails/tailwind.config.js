/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#4F7942",
          secondary: "#F5A623",
          bg: "#F9F7F3",
        },
      },
    },
  },
  plugins: [],
};
