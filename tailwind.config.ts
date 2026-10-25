import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        clay: { 50: "#faf6f2", 100: "#f2e9e0", 200: "#e4d3c2", 400: "#b98d6a", 500: "#9c6b47", 600: "#7d5236", 800: "#3d2a1d", 900: "#2a1d14" },
        moss: { 500: "#5f7a5a", 600: "#4b6347" },
      },
      fontFamily: { sans: ["Pretendard", "Noto Sans KR", "sans-serif"], serif: ["'Gowun Batang'", "serif"] },
      maxWidth: { content: "1160px" },
    },
  },
  plugins: [],
} satisfies Config;
