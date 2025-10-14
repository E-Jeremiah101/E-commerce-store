// tailwind.config.mjs
export default {
  theme: {
    screens: {
      sm: "640px",
      smd: "700px", // custom screen between sm and md
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      fontFamily: {
        bebas: ["Bebas Neue", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwind-scrollbar-hide")],
};
