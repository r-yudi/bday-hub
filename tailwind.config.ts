import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--bg) / <alpha-value>)",
        surface: "hsl(var(--surface) / <alpha-value>)",
        surface2: "hsl(var(--surface-2) / <alpha-value>)",
        text: "hsl(var(--text) / <alpha-value>)",
        muted: "hsl(var(--muted) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        primary: "hsl(var(--primary) / <alpha-value>)",
        primaryForeground: "hsl(var(--primary-foreground) / <alpha-value>)",
        accent: "hsl(var(--accent) / <alpha-value>)",
        accentForeground: "hsl(var(--accent-foreground) / <alpha-value>)",
        lilac: "hsl(var(--lilac) / <alpha-value>)",
        danger: "hsl(var(--danger) / <alpha-value>)",
        warning: "hsl(var(--warning) / <alpha-value>)",
        success: "hsl(var(--success) / <alpha-value>)",

        // Backward-compatible aliases used across the app.
        ink: "hsl(var(--text) / <alpha-value>)",
        paper: "hsl(var(--bg) / <alpha-value>)",
        warm: "hsl(var(--warning) / <alpha-value>)",
        accentHover: "color-mix(in oklab, hsl(var(--primary)) 88%, black)"
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)"
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)"
      },
      transitionTimingFunction: {
        brand: "var(--ease)"
      },
      transitionDuration: {
        150: "var(--dur-1)",
        250: "var(--dur-2)"
      }
    }
  },
  plugins: []
};

export default config;
