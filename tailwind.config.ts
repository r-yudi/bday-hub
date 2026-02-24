import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b1220",
        paper: "#FFF7ED",
        accent: "#FF4D4F",
        accentHover: "#E04345",
        warm: "#FFC857"
      }
    }
  },
  plugins: []
};

export default config;
