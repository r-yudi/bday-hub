import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b1220",
        paper: "#f7f5ef",
        accent: "#0f766e",
        warm: "#f59e0b"
      }
    }
  },
  plugins: []
};

export default config;
