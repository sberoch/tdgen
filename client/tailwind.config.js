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
        lightgray: "#F2F2F2",
        gray: "#E4E4E4",
      },
    },
  },
  plugins: [],
};
