// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Dejamos extend vacío porque todos tus colores y fuentes
      // ya están definidos con CSS nativo en globals.css
      // gracias a la magia del @theme de Tailwind.
    },
  },
  plugins: [],
};
export default config;