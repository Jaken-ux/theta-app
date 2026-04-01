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
          card: "#151D2E",
          border: "#2A3548",
          muted: "#B0B8C4",
        },
      },
    },
  },
  plugins: [],
};
export default config;
