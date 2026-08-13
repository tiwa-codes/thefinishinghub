import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: "#0d3d28",
        "deep-forest": "#072818",
        gold: "#b89544",
        "gold-bright": "#d4b660",
        cream: "#f4efe4",
        ink: "#161310",
      },
      fontFamily: {
        serif: ["var(--font-fraunces)"],
        sans: ["var(--font-inter)"],
        mono: ["var(--font-jetbrains-mono)"],
      },
    },
  },
  plugins: [],
};
export default config;
