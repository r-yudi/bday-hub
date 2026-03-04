import nextConfig from "eslint-config-next";

const config = [
  ...nextConfig,
  {
    rules: {
      "@next/next/no-img-element": "off",
      "react-hooks/set-state-in-effect": "off",
      "react/no-unescaped-entities": "off",
      "import/no-anonymous-default-export": "off"
    }
  },
  {
    ignores: [".next/", "public/sw.js", "public/workbox-*.js"]
  }
];

export default config;
