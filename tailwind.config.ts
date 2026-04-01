import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        theta: {
          teal: "#2AB8E6",
          dark: "#0A0F1C",
          card: "#111827",
          border: "#1F2937",
          muted: "#9CA3AF",
        },
      },
    },
  },
  plugins: [],
};
export default config;
