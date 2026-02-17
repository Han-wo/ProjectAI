import type { Config } from "tailwindcss";
import pxToRem from "tailwindcss-px-to-rem";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "SUIT",
          "Pretendard",
          "Apple SD Gothic Neo",
          "Noto Sans KR",
          "Segoe UI",
          "sans-serif"
        ],
        mono: [
          "JetBrains Mono",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "monospace"
        ]
      },
      colors: {
        canvas: "#eff1eb",
        ink: "#14222e",
        soft: "#3f5b67",
        ember: "#e35f2d",
        tide: "#157f86"
      },
      boxShadow: {
        card: "0 18px 45px rgba(18, 32, 38, 0.14)"
      }
    }
  },
  plugins: [pxToRem]
};

export default config;
