// tailwind.config.js
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      screens: {
        xs: "475px",
      },
      boxShadow: {
        "right-bottom": "4px 4px 6px rgba(0, 0, 0, 0.1)",
        "neon-blue":
          "0 0 10px 2px rgba(0,178,255,0.7), 0 0 20px 6px rgba(0,178,255,0.5)",
        "neon-orange":
          "0 0 4px 1px rgba(255,184,0, 0.7), 0 0 4px 1px rgba(255,184,0, 0.5)",
        "neon-dark":
          "0 0 10px 2px rgba(0, 0, 0, 1), 0 0 20px 6px rgba(0, 0, 0, 1)",
      },
    },
  },
  plugins: [],
};
