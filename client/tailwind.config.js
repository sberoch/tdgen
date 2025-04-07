/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      screens: {
        "3xl": "1920px",
      },
      colors: {
        "footer-primary": "#006FB4",
        "footer-secondary": "#004371",
        secondary: "#004371",
        tertiary: "#0085D8",
        lightgray: "#F2F2F2",
        gray: "#E4E4E4",
      },
    },
  },
  plugins: [],
  safelist: [
    "bg-white",
    "bg-gray-100",
    "bg-gray-200",
    "bg-gray-300",
    "bg-gray-400",
    "bg-gray-500",
  ],
};
