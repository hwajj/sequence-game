// tailwind.config.js
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      screens: {
        xs: { max: "390px" }, // 391px 미만에서 적용되는 커스텀 브레이크포인트
      },
    },
  },
  plugins: [],
};
