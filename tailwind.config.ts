import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',  // 🆕 Enable dark mode via CSS class (Whop standard)
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};


export default config;

